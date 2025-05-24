import {WebSocket} from 'ws';
import {
    IsArray,
    IsBoolean,
    IsEnum,
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

async function departDronesForMission() {
    // query drones, which right now should be on mission but are not
    const drones = await prisma.drone.findMany({
        select: {
            id: true,
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
        where: {isActive: true, isOnMission: false}
    });

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

        droneTaskListener.emit(drone.id, {
            type: 'drone:depart',
            missionDetails,
        });
    });

    await Promise.all(promises);
}

setInterval(departDronesForMission, 1000); // every second check if any drone should depart for a mission

export class Drone {
    private ws: WebSocket;
    private drone: DroneDTO;

    public static async fromWebSocket(ws: WebSocket, droneData: DroneDTO): Promise<Drone> {
        droneData = await validateDto(DroneDTO, droneData);
        const drone = new Drone(ws, droneData);

        await drone.syncWithDatabase();

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
            await this.handleDisconnect();
        });

        droneTaskListener.on(this.drone.id, async (data) => {
            try {
                await this.handleMessage(data);
            } catch (err) {
                console.error('Error handling drone task:', err);
            }
        });
    }

    async handleMessage(data: any) {
        switch (data.type) {
            case 'toDrone:depart':
                if (this.drone.isOnMission) {
                    console.warn(`Drone ${this.drone.id} is already on a mission.`);
                    return;
                }
                this.drone.isOnMission = true;
                await this.departTheDrone(data.missionDetails);
                await this.syncWithDatabase();
                break;
            case 'toDrone:getFlightPermit':
                await this.getFlightPermit();
                break;
            case 'fromDrone:gotFlightPermit':
                await this.gotFlightPermit();
                break;
            case 'fromDrone:update':
                await this.updateDroneData(data.droneData);
                break;
            case 'fromDrone:missionRaport':
                await this.processMissionRaport(data.raport);
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
                        imageBlobBase64: image,
                    }))
                }
            }
        });
    }

    async updateDroneData(droneData: DroneDTO) {
        droneData = await validateDto(DroneDTO, droneData);
        this.drone = droneData;
        await this.syncWithDatabase();
    }

    async gotFlightPermit() {
        this.drone.gotFlightPermit = true;
        await this.syncWithDatabase();
    }

    async getFlightPermit() {
        const wsSend = promisify(this.ws.send);
        await wsSend(JSON.stringify({
            type: 'toDrone:getFlightPermit'
        }));
    }

    async departTheDrone(mission: MissionDetailsDTO) {
        const wsSend = promisify(this.ws.send);
        await wsSend(JSON.stringify({
            type: 'toDrone:depart',
            missionDetails: mission
        }))
    }
}
