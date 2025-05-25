import {WebSocket} from 'ws';
import {
    IsArray,
    IsBoolean,
    IsEnum, IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import {prisma} from './prisma';
import events from 'events';
import {promisify} from "util";
import {validateDto} from "./utils";

export class DroneDTO {
    @IsNotEmpty()
    @IsString()
    id!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsEnum(['land', 'water', 'air', 'space'])
    type!: 'land' | 'water' | 'air' | 'space';

    @IsNotEmpty()
    @IsEnum(['fuel', 'electric'])
    engineType!: 'fuel' | 'electric';

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(100)
    fuelOrBatteryLevel!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(-90)
    @Max(90)
    currentLatitude!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(-180)
    @Max(180)
    currentLongitude!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    maxSpeedKmh!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    maxDistanceKm!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    pricePerHourUSD!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    noiseLevelDb!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    lengthCm!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    widthCm!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    heightCm!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    maxLoadKg!: number;

    @IsNotEmpty()
    @IsEnum(['rescue', 'reconnaissance', 'assault', 'agriculture', 'delivery'])
    specialization!: 'rescue' | 'reconnaissance' | 'assault' | 'agriculture' | 'delivery';

    @IsOptional()
    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean = true;

    @IsOptional()
    @IsNotEmpty()
    @IsBoolean()
    isOnMission: boolean = false;

    @IsOptional()
    @IsNotEmpty()
    @IsBoolean()
    gotFlightPermit: boolean = false;

    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @IsInt()
    frequencyHz?: number;

    @IsOptional()
    @IsNumber()
    percentageMissionCompleted?: number;
}

export class MissionRaportDTO {
    @IsNotEmpty()
    @IsString()
    missionId!: string;

    @IsNotEmpty()
    @IsString()
    droneId!: string;

    @IsOptional()
    @IsString()
    reportContent?: string;

    @IsOptional()
    @IsArray()
    @IsString({each: true})
    imagesBlobBase64: string[] = [];
}

export class MissionDetailsDTO {
    @IsNotEmpty()
    @IsString()
    id!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsNumber()
    locationLongitude!: number;

    @IsNotEmpty()
    @IsNumber()
    locationLatitude!: number;

    @IsNotEmpty()
    @IsNumber()
    startTime!: number;

    @IsOptional()
    @IsNumber()
    expectedEndTime?: number;

    @IsNotEmpty()
    @IsEnum(['rescue', 'reconnaissance', 'assault', 'agriculture', 'delivery'])
    goal!: 'rescue' | 'reconnaissance' | 'assault' | 'agriculture' | 'delivery';
}

// event emitter for drone tasks:
export const droneTaskListener = new events.EventEmitter();

// We shouldn't do that, but who cares:
const dronesAlreadyDeparted: string[] = [];

async function departDronesForMission() {
    // query drones, which right now should be on mission but are not
    let drones = await prisma.drone.findMany({
        select: {
            id: true,
            isOnMission: true,
            missions: {
                where: {startTime: {lte: new Date()}}, // missions that have started
                select: {
                    id: true,
                    name: true,
                    description: true,
                    locationLongitude: true,
                    locationLatitude: true,
                    startTime: true,
                    expectedEndTime: true,
                    goal: true,
                }
            }
        },
        where: {isActive: { equals: true }, isOnMission: { equals: false }},
    });
    drones = drones.filter(drone => drone.missions.length > 0); // only those with missions
    drones = drones.filter(drone => !dronesAlreadyDeparted.includes(drone.id));

    const promises = drones.map(async drone => {
        if (drone.missions.length === 0) return;
        if (drone.missions.length > 1) {
            console.warn(`Drone ${drone.id} has multiple missions, sending it to the first one.`);
        }
        const mission = drone.missions[0];
        let missionDetails: MissionDetailsDTO = {
            id: mission.id,
            name: mission.name,
            description: mission.description,
            locationLongitude: mission.locationLongitude,
            locationLatitude: mission.locationLatitude,
            startTime: mission.startTime.getTime(),
            expectedEndTime: mission.expectedEndTime ? mission.expectedEndTime.getTime() : undefined,
            goal: mission.goal as any,
        };
        missionDetails = await validateDto(MissionDetailsDTO, missionDetails);

        dronesAlreadyDeparted.push(drone.id);

        droneTaskListener.emit(drone.id, {
            type: 'toDrone:depart',
            missionDetails,
        });
    });

    await Promise.all(promises);
}

setTimeout(() => {
    setInterval(departDronesForMission, 1000); // every second check if any drone should depart for a mission
}, 2000);

const MIN_DRON_HZ = 100; // minimum frequency for drone communication in Hz
const MAX_DRON_HZ = 1000; // maximum frequency for drone communication in Hz

export class Drone {
    private ws: WebSocket;
    private drone: DroneDTO;

    private currentMission: MissionDetailsDTO | null = null;

    private latBeforeMission: number = 0;
    private lonBeforeMission: number = 0;

    private nearbyDrones: { distanceKm: number, frequencyHz: number, id: string }[] = [];
    private nearbyDronesIntervalId: NodeJS.Timeout | null = null;

    public static async fromWebSocket(ws: WebSocket, droneData: DroneDTO): Promise<Drone> {
        droneData = await validateDto(DroneDTO, droneData);
        const drone = new Drone(ws, droneData);

        await drone.syncWithDatabase();
        await drone.updateNearbyDronesInterval();

        return drone;
    }

    async syncWithDatabase() {
        await prisma.drone.upsert({
            where: {id: this.drone.id},
            update: this.drone,
            create: this.drone,
        });
    }

    constructor(ws: WebSocket, drone: DroneDTO) {
        this.ws = ws;
        this.drone = drone;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleMessage(data);
            } catch (err) {
                console.error('Failed to parse message:', err);
            }
        });

        ws.on('close', async () => {
            console.warn(`Drone ${this.drone.id} disconnected.`);
            await this.handleDisconnect();
            if (this.nearbyDronesIntervalId) {
                clearInterval(this.nearbyDronesIntervalId);
                this.nearbyDronesIntervalId = null;
            }
        });

        droneTaskListener.on(this.drone.id, async (data) => {
            try {
                await this.handleMessage(data);
            } catch (err) {
                console.error('Error handling drone task:', err);
            }
        });
    }

    // Updates list of the nearest drones within the mission
    async updateNearbyDronesInterval() {
        this.nearbyDronesIntervalId = setInterval(this.updateNearbyDrones.bind(this), 5000);
    }

    async updateNearbyDrones() {
        const mission = await prisma.mission.findFirst({
            where: {drones: {some: {id: this.drone.id}}},
            select: {id: true}
        });
        if (!mission) return;

        const missionId = mission.id;

        const nearbyDrones = await prisma.drone.findMany({
            where: {
                isActive: true,
                isOnMission: true,
                missions: {
                    some: {id: missionId}
                },
                id: {not: this.drone.id}, // exclude itself
                currentLatitude: {
                    gte: this.drone.currentLatitude - 0.1, // 0.1 degree ~ 11 km
                    lte: this.drone.currentLatitude + 0.1,
                },
                currentLongitude: {
                    gte: this.drone.currentLongitude - 0.1,
                    lte: this.drone.currentLongitude + 0.1,
                },
            },
            select: {
                id: true,
                name: true,
                currentLatitude: true,
                currentLongitude: true,
            }
        });

        this.nearbyDrones = nearbyDrones.map(drone => {
            const latDiff = drone.currentLatitude - this.drone.currentLatitude;
            const lonDiff = drone.currentLongitude - this.drone.currentLongitude;
            const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

            const distanceKm = distance * 111; // ~111 km per degree of latitude/longitude

            return {
                id: drone.id,
                distanceKm,
                frequencyHz: this.drone.frequencyHz || -1, // Assuming frequencyHz is set on the drone
            };
        });

        const wsSend = promisify(this.ws.send.bind(this.ws));
        await wsSend(JSON.stringify({
            type: 'toDrone:nearbyDronesUpdate',
            data: nearbyDrones
        }));
    }

    async handleMessage(data: any) {
        switch (data.type) {
            case 'toDrone:depart':
                if (this.drone.isOnMission) {
                    console.warn(`Drone ${this.drone.id} is already on a mission.`);
                    return;
                }
                await this.departTheDrone(data.missionDetails)
                break;
            case 'toDrone:getFlightPermit':
                await this.getFlightPermit();
                break;
            case 'fromDrone:gotFlightPermit':
                await this.gotFlightPermit();
                break;
            case 'fromDrone:update':
                await this.updateDroneData(data.drone);
                break;
            case 'fromDrone:missionRaport':
                await this.processMissionRaport(data.raport);
                await this.handleCameFromMission();
                break;
            case 'fromDrone:cameFromMission':
                await this.handleCameFromMission();
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }

    async handleDisconnect() {
        this.drone.isActive = false;
        await this.syncWithDatabase();
        this.ws.close();
    }

    async handleCameFromMission() {
        this.drone.isOnMission = false;
        this.drone.gotFlightPermit = false;
        await this.syncWithDatabase();

        // reset
        this.latBeforeMission = 0;
        this.lonBeforeMission = 0;
        this.currentMission = null;

        // if all drones came back from mission, set mission as completed
        await prisma.mission.updateMany({
            where: {
                drones: {
                    every: {isOnMission: false}
                }
            },
            data: {
                endTime: new Date(),
                isCompleted: true,
            }
        });
    }

    async processMissionRaport(raport: MissionRaportDTO) {
        raport = await validateDto(MissionRaportDTO, raport);
        const existingRaport = await prisma.missionReport.findUnique({
            where: {missionId: raport.missionId}
        });

        if (existingRaport) {
            console.warn(`Mission report for mission ${raport.missionId} already exists.`);
            return;
        }

        await prisma.missionReport.create({
            data: {
                missionId: raport.missionId,
                droneId: raport.droneId,
                reportContent: raport.reportContent,
                reportDate: new Date(),
                ReportImages: {
                    create: raport.imagesBlobBase64.map((image) => ({
                        imageBlobBase64: Buffer.from(image, 'base64'),
                    }))
                }
            }
        });
    }

    async updateDroneData(droneData: DroneDTO) {
        let missionCompletedPercentage: number | undefined = undefined;
        if (this.latBeforeMission || this.lonBeforeMission) {
            // we are in a mission, somewhere between start location and destination (mission lat/log)
            // calculate percentage of the mission completed based on current lat/lon
            const totalTraveledDistance = Math.sqrt(
                Math.pow(droneData.currentLatitude - this.latBeforeMission, 2) +
                Math.pow(droneData.currentLongitude - this.lonBeforeMission, 2)
            );

            const totalMissionDistance = Math.sqrt(
                Math.pow(this.currentMission!.locationLatitude - this.latBeforeMission, 2) +
                Math.pow(this.currentMission!.locationLongitude - this.lonBeforeMission, 2)
            );

            if (totalMissionDistance > 0) {
                missionCompletedPercentage = (totalTraveledDistance / totalMissionDistance) * 100;
                missionCompletedPercentage = Math.min(missionCompletedPercentage, 100); // cap at 100%
            }

            console.log(`Drone ${this.drone.id} mission completed: ${missionCompletedPercentage}%`);
        }

        droneData = await validateDto(DroneDTO, droneData);
        this.drone.percentageMissionCompleted = missionCompletedPercentage;
        this.drone = droneData;
        await this.syncWithDatabase();
    }

    async gotFlightPermit() {
        this.drone.gotFlightPermit = true;
        await this.syncWithDatabase();
    }

    async getFlightPermit() {
        this.ws.send(JSON.stringify({
            type: 'toDrone:getFlightPermit'
        }));
    }

    async departTheDrone(mission: MissionDetailsDTO) {
        this.drone.isOnMission = true;
        await this.syncWithDatabase();


        this.latBeforeMission = this.drone.currentLatitude;
        this.lonBeforeMission = this.drone.currentLongitude;

        this.currentMission = mission;

        this.ws.send(JSON.stringify({
            type: 'toDrone:depart',
            missionDetails: mission
        }));
    }
}
