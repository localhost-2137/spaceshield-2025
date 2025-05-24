import express from 'express';
import bodyParser from 'body-parser';
import {Server, WebSocket} from 'ws';

const app = express();
const port = 3000;

app.use(bodyParser.json());

const wsServer = new Server({noServer: true});

function wsSend(ws: WebSocket, message: any) {
    ws.send(JSON.stringify(message));
}

function wsOn(ws: WebSocket, type: string, callback: (value: any) => void) {
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        if (data.type === type) {
            callback(data.value);
        }
    });
}

wsServer.on('connection', (ws) => {
    ws.once('close', () => {
    });
});


const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});

