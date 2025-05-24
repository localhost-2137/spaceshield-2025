import express from 'express';
import bodyParser from 'body-parser';
import {Server, WebSocket} from 'ws';
import {initPrisma, prisma} from './prisma';
import {Drone} from "./drones";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const wsServer = new Server({noServer: true});

async function handleWsMessages(ws: WebSocket, req: any, unsubscribe: () => void) {
    switch (req.type) {
        case 'fromDrone:register':
            await Drone.fromWebSocket(ws, req.drone);
            unsubscribe();
            break;
        default:
            console.error('Unknown request type:', req.type);
    }
}

wsServer.on('connection', (ws) => {
    const handleMessages = async (msg: any) => {
        // it allows to unsubscribe from the 'message' event if e.g. the logic has been moved to another part of the codebase
        const unsubscribe = () => ws.off('message', handleMessages);
        try {
            const data = JSON.parse(msg.toString());
            await handleWsMessages(ws, data, unsubscribe);
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
        }
    };

    ws.on('message', handleMessages);
});

app.get('/drones', async (req, res) => {
    try {
        const drones = await prisma.drone.findMany({
            where: {isActive: true},
        });
        res.json(drones);
    } catch (err) {
        console.error('Failed to fetch drones:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
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
