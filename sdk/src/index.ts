import WebSocket from 'ws';

interface DroneData {
    location: { lat: number; lon: number };
    generalInfo: { id: string; model: string };
    batteryPercentage: number;
}

interface RegisterMessage {
    type: 'fromDrone:register';
    droneData: DroneData;
}

interface UpdateMessage {
    type: 'fromDrone:update';
    droneData: DroneData;
}

interface MissionRaportMessage {
    type: 'fromDrone:missionRaport';
    raport: any;
}

interface CameFromMissionMessage {
    type: 'fromDrone:cameFromMission';
}

interface DepartMessage {
    type: 'toDrone:depart';
    missionDetails: any;
}

type WebSocketMessage = RegisterMessage | UpdateMessage | MissionRaportMessage | CameFromMissionMessage | DepartMessage;

interface DroneSDKOptions {
    getLocation: () => Promise<{ lat: number; lon: number }>;
    getGeneralInfo: () => Promise<{ id: string; model: string }>;
    getBatteryPercentage: () => Promise<number>;
    onMissionDepart: (missionDetails: any) => Promise<void>;
    updateInterval: number; // in milliseconds, default is 1000ms
}

export class DroneSDK {
    private ws: WebSocket;
    private readonly getLocation: () => Promise<{ lat: number; lon: number }>;
    private readonly getGeneralInfo: () => Promise<{ id: string; model: string }>;
    private readonly getBatteryPercentage: () => Promise<number>;
    private readonly onMissionDepart: (missionDetails: any) => Promise<void>;
    private readonly updateInterval: number;
    private previousData: DroneData | null;
    private messageQueue: { message: WebSocketMessage; resolve: () => void; reject: (reason: any) => void }[] = [];

    constructor(wsUrl: string, options: DroneSDKOptions) {
        const {
            getLocation,
            getGeneralInfo,
            getBatteryPercentage,
            onMissionDepart,
            updateInterval = 1000
        } = options;

        this.ws = new WebSocket(wsUrl);
        this.getLocation = getLocation;
        this.getGeneralInfo = getGeneralInfo;
        this.getBatteryPercentage = getBatteryPercentage;
        this.onMissionDepart = onMissionDepart;
        this.updateInterval = updateInterval;
        this.previousData = null;

        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('error', this.onError.bind(this));
    }

    private async onOpen() {
        const droneData: DroneData = {
            location: await this.getLocation(),
            generalInfo: await this.getGeneralInfo(),
            batteryPercentage: await this.getBatteryPercentage()
        };

        await this.sendMessage({type: 'fromDrone:register', droneData}).catch(error => {
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
        const [location, generalInfo, batteryPercentage] = await Promise.all([
            this.getLocation(),
            this.getGeneralInfo(),
            this.getBatteryPercentage()
        ]);

        const currentData: DroneData = {location, generalInfo, batteryPercentage};

        if (!this.previousData ||
            JSON.stringify(currentData.location) !== JSON.stringify(this.previousData.location) ||
            JSON.stringify(currentData.generalInfo) !== JSON.stringify(this.previousData.generalInfo) ||
            currentData.batteryPercentage !== this.previousData.batteryPercentage) {
            await this.sendMessage({type: 'fromDrone:update', droneData: currentData});
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

    public async sendMissionRaport(raport: any): Promise<void> {
        await this.sendMessage({type: 'fromDrone:missionRaport', raport});
    }

    public async cameFromMission(): Promise<void> {
        await this.sendMessage({type: 'fromDrone:cameFromMission'});
    }
}
