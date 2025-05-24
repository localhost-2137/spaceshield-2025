import {WebSocket} from 'ws';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    validateOrReject
} from 'class-validator';
import {prisma} from './prisma';
import events from 'events';
import {Prisma} from '@prisma/client';

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
    @IsEnum(['rescue', 'reconnaissance', 'assault'])
    specialization!: 'rescue' | 'reconnaissance' | 'assault';

    @IsOptional()
    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean = true;

    @IsOptional()
    @IsNotEmpty()
    @IsBoolean()
    isOnMission: boolean = false;
}

// event emmiter for drone tasks:
const droneTaskListener = new events.EventEmitter();

async function departDronesForMission() {
    // query drones, which right now should be on mission but are not
    const drones = await prisma.drone.findMany({
        select: {
            id: true,
            missions: {
                where: {startTime: {lte: new Date()}}, // missions that have started
            }
        },
        where: {isActive: true, isOnMission: false}
    });

    drones.forEach(drone => {
        if (drone.missions.length === 0) return;
        if (drone.missions.length > 1) {
            console.warn(`Drone ${drone.id} has multiple missions, sending it to the first one.`);
        }
        const mission = drone.missions[0];

        droneTaskListener.emit(drone.id, {
            type: 'drone:depart',
            missionDetails: mission
        });
    });
}

export class Drone {
    private ws: WebSocket;
    private drone: DroneDTO;

    public static async fromWebSocket(ws: WebSocket, droneData: DroneDTO): Promise<Drone> {
        await validateOrReject(droneData);
        const drone = new Drone(ws, droneData);

        await drone.syncWithDatabase();

        return drone;
    }

    async syncWithDatabase() {
        await prisma.drone.upsert({
            where: {id: this.drone.id},
            update: this.drone,
            create: this.drone
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
            case 'fromDrone:update':
                await this.updateDroneData(data.droneData);
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }

    async updateDroneLocation(location: {latitude: number, longitude: number}) {
        await prisma.drone.update({
            where: {id: this.drone.id},
            data: {
                currentLatitude: location.latitude,
                currentLongitude: location.longitude
            }
        });

        // Optionally, send the updated location back to the drone
        this.ws.send(JSON.stringify({
            type: 'fromDrone:updateLocation',
            location
        }));
    }

    async handleDisconnect() {
        this.drone.isActive = false;
        await this.syncWithDatabase();
        this.ws.close();
    }

    async updateDroneData(droneData: DroneDTO) {
        await validateOrReject(droneData);
        this.drone = droneData;
        await this.syncWithDatabase();
    }

    async departTheDrone(mission: Prisma.MissionCreateInput) {
        // TODO: send info via WebSocket to the drone
    }
}
