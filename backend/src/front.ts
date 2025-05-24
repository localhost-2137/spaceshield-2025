import {Server, WebSocket} from "ws";
import {prisma} from "./prisma";

export const wsFrontServer = new Server({noServer: true});

wsFrontServer.on('connection', (ws) => {
    new FrontendWs(ws);
});

const DRONES_LOCATION_INTERVAL = 1000; // 1 second

class FrontendWs {
    ws: WebSocket;

    private lastTimeLocationQueried: Date = new Date(0); // Firstly send all drones' locations
    private dronesLocationIntervalId: NodeJS.Timeout | null = null;

    constructor(ws: WebSocket) {
        this.ws = ws;

        this.startDronesLocationUpdates();
        ws.on('message', async (msg) => {
            try {
                const data = JSON.parse(msg.toString());
                await this.handleWsMsg(data);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        });

        ws.on('close', async () => {
            await this.handleDisconnect();
        });
    }

    async handleWsMsg(msg: any) {
        switch (msg.type) {
            default:
                console.error('Unknown request type:', msg.type);
        }
    }

    startDronesLocationUpdates() {
        if (this.dronesLocationIntervalId) return; // Already started

        this.dronesLocationIntervalId = setInterval(async () => {
            try {
                const drones = await prisma.drone.findMany({
                    where: { isActive: true, updatedAt: { gt: this.lastTimeLocationQueried } },
                });
                this.lastTimeLocationQueried = new Date();

                if (drones.length > 0) this.ws.send(JSON.stringify({
                    type: 'dronesLocationUpdate',
                    data: drones
                }));
            } catch (err) {
                console.error('Failed to fetch drones location:', err);
            }
        }, DRONES_LOCATION_INTERVAL);
    }

    async handleDisconnect() {
        if (this.dronesLocationIntervalId) {
            clearInterval(this.dronesLocationIntervalId);
            this.dronesLocationIntervalId = null;
        }
    }
}
