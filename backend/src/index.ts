import express from 'express';
import bodyParser from 'body-parser';
import {Server, WebSocket} from 'ws';
import {initPrisma} from './prisma';
import {Drone} from "./drones";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const wsServer = new Server({noServer: true});

async function handleWsMessages(ws: WebSocket, req: any) {
    switch (req.type) {
        case 'fromDrone:register':
            await Drone.fromWebSocket(ws, req.droneData);
            break;
        default:
            console.error('Unknown request type:', req.type);
    }
}

wsServer.on('connection', (ws) => {
    ws.on('message', async msg => {
        try {
            const data = JSON.parse(msg.toString());
            await handleWsMessages(ws, data);
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
        }
    });
});

async function bootstrap() {
    await initPrisma();
    //await initRedis();

    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });
}

bootstrap().catch((err) => {
    console.error('Failed to bootstrap the application:', err);
    process.exit(1);
});
