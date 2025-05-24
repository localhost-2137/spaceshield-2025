import WebSocket from 'ws';

export interface Location {
    latitude: number;
    longitude: number;
}

export interface GeneralDroneInfo {
    id: string;
    name: string;
    description: string;
    type: 'land' | 'water' | 'air' | 'space';
    engineType: 'fuel' | 'electric';
    maxSpeedKmh: number;
    maxDistanceKm: number;
    pricePerHourUSD: number;
    noiseLevelDb: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    maxLoadKg: number;
    specialization: 'rescue' | 'reconnaissance' | 'assault' | 'transport' | 'agriculture' | 'delivery';
}

interface DroneData {
    currentLocation: Location;
    generalInfo: GeneralDroneInfo;
    batteryPercentage: number;
}

export interface MissionDetails {
    id: string;
    name: string;
    description: string;
    locationLongitude: number;
    locationLatitude: number;
    startTime: number;
    expectedEndTime?: number;
    goal: string;
}

export interface MissionRaportDTO {
    missionId: string;
    droneId: string;
    reportContent?: string;
    imagesBlobBase64: string[];
}

export interface ApiCompatibleDTO {
    id: string;
    name: string;
    description: string;
    type: 'land' | 'water' | 'air' | 'space';
    engineType: 'fuel' | 'electric';
    fuelOrBatteryLevel: number;
    currentLatitude: number;
    currentLongitude: number;
    maxSpeedKmh: number;
    maxDistanceKm: number;
    pricePerHourUSD: number;
    noiseLevelDb: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    maxLoadKg: number;
    specialization: 'rescue' | 'reconnaissance' | 'assault' | 'transport' | 'agriculture' | 'delivery';
}


interface RegisterMessage {
    type: 'fromDrone:register';
    drone: ApiCompatibleDTO;
}

interface UpdateMessage {
    type: 'fromDrone:update';
    drone: ApiCompatibleDTO;
}

interface MissionRaportMessage {
    type: 'fromDrone:missionRaport';
    raport: MissionRaportDTO;
}

interface CameFromMissionMessage {
    type: 'fromDrone:cameFromMission';
}

interface DepartMessage {
    type: 'toDrone:depart';
    missionDetails: MissionDetails;
}

type WebSocketMessage = RegisterMessage | UpdateMessage | MissionRaportMessage | CameFromMissionMessage | DepartMessage;

interface DroneSDKOptions {
    generalInfo: GeneralDroneInfo;
    getLocation: () => Promise<Location>;
    getBatteryPercentage: () => Promise<number>;
    onMissionDepart: (missionDetails: MissionDetails) => Promise<void>;
    updateInterval?: number; // in milliseconds, default is 1000ms
}

export const WS_URL = 'ws://localhost:3000';

export class DroneSDK {
    private ws: WebSocket;
    private readonly getLocation: () => Promise<Location>;
    private readonly generalInfo: GeneralDroneInfo;
    private readonly getBatteryPercentage: () => Promise<number>;
    private readonly onMissionDepart: (missionDetails: MissionDetails) => Promise<void>;
    private readonly updateInterval: number;
    private previousData: DroneData | null;
    private messageQueue: { message: WebSocketMessage; resolve: () => void; reject: (reason: any) => void }[] = [];

    constructor(options: DroneSDKOptions) {
        const {
            getLocation,
            generalInfo,
            getBatteryPercentage,
            onMissionDepart,
            updateInterval = 1000
        } = options;

        this.ws = new WebSocket(WS_URL);
        this.getLocation = getLocation;
        this.generalInfo = generalInfo;
        this.getBatteryPercentage = getBatteryPercentage;
        this.onMissionDepart = onMissionDepart;
        this.updateInterval = updateInterval;
        this.previousData = null;

        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('error', this.onError.bind(this));
    }

    private dronDataIntoApiCompatibleDTO(droneData: DroneData): ApiCompatibleDTO {
        return {
            id: droneData.generalInfo.id,
            name: droneData.generalInfo.name,
            description: droneData.generalInfo.description,
            type: droneData.generalInfo.type,
            engineType: droneData.generalInfo.engineType,
            fuelOrBatteryLevel: droneData.batteryPercentage,
            currentLatitude: droneData.currentLocation.latitude,
            currentLongitude: droneData.currentLocation.longitude,
            maxSpeedKmh: droneData.generalInfo.maxSpeedKmh,
            maxDistanceKm: droneData.generalInfo.maxDistanceKm,
            pricePerHourUSD: droneData.generalInfo.pricePerHourUSD,
            noiseLevelDb: droneData.generalInfo.noiseLevelDb,
            lengthCm: droneData.generalInfo.lengthCm,
            widthCm: droneData.generalInfo.widthCm,
            heightCm: droneData.generalInfo.heightCm,
            maxLoadKg: droneData.generalInfo.maxLoadKg,
            specialization: droneData.generalInfo.specialization
        };
    }

    private async onOpen() {
        const [currentLocation, batteryPercentage] = await Promise.all([
            this.getLocation(),
            this.getBatteryPercentage()
        ]);

        const droneData: DroneData = {
            generalInfo: this.generalInfo,
            currentLocation,
            batteryPercentage,
        };
        const apiCompatibleDTO = this.dronDataIntoApiCompatibleDTO(droneData);

        await this.sendMessage({type: 'fromDrone:register', drone: apiCompatibleDTO}).catch(error => {
            console.error('Failed to send register message:', error);
        });

        this.previousData = {...droneData};
        setInterval(this.checkAndUpdate.bind(this), this.updateInterval);

        while (this.messageQueue.length > 0) {
            const {message, resolve, reject} = this.messageQueue.shift()!;
            try {
                this.ws.send(JSON.stringify(message));
                resolve();
            } catch (error) {
                reject(error);
            }
        }
    }

    private async onMessage(message: string) {
        const data: WebSocketMessage = JSON.parse(message);
        if (data.type === 'toDrone:depart') {
            await this.onMissionDepart(data.missionDetails);
        } else {
            console.error('Unknown message type:', data.type);
        }
    }

    private onClose() {
        console.log('WebSocket connection closed');
        const closeError = new Error('WebSocket connection closed');
        this.messageQueue.forEach(({reject}) => reject(closeError));
        this.messageQueue = [];
    }

    private onError(error: Error) {
        console.error('WebSocket error:', error);
        this.messageQueue.forEach(({reject}) => reject(error));
        this.messageQueue = [];
    }

    private async checkAndUpdate() {
        const [location, batteryPercentage] = await Promise.all([
            this.getLocation(),
            this.getBatteryPercentage()
        ]);

        const currentData: DroneData = {currentLocation: location, generalInfo: this.generalInfo, batteryPercentage};

        if (!this.previousData ||
            JSON.stringify(currentData.currentLocation) !== JSON.stringify(this.previousData.currentLocation) ||
            JSON.stringify(currentData.generalInfo) !== JSON.stringify(this.previousData.generalInfo) ||
            currentData.batteryPercentage !== this.previousData.batteryPercentage) {
            await this.sendMessage({type: 'fromDrone:update', drone: this.dronDataIntoApiCompatibleDTO(currentData)});
            this.previousData = {...currentData};
        }
    }

    public sendMessage(message: WebSocketMessage): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws.readyState === this.ws.OPEN) {
                try {
                    this.ws.send(JSON.stringify(message));
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                this.messageQueue.push({message, resolve, reject});
            }
        });
    }

    public async sendMissionRaport(raport: MissionRaportDTO): Promise<void> {
        await this.sendMessage({type: 'fromDrone:missionRaport', raport});
    }

    public async cameFromMission(): Promise<void> {
        await this.sendMessage({type: 'fromDrone:cameFromMission'});
    }
}
