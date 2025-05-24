import {prisma} from "./prisma";

import express from 'express';
import {CreateMissionDTO} from "./restDto";
import {validateDto} from "./utils";

const router = express.Router();

router.get('/drones', async (req, res) => {
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

router.post('/mission', async (req, res) => {
    const createDTO: CreateMissionDTO = await validateDto(CreateMissionDTO, req.body);
    // all dron exists for sure as well dto is valid

    let prismaCompatibleDtoClone = JSON.parse(JSON.stringify(createDTO)); // deep clone to avoid mutation
    delete prismaCompatibleDtoClone.dronesIds;

    prismaCompatibleDtoClone.startTime = new Date(prismaCompatibleDtoClone.startTime);
    prismaCompatibleDtoClone.expectedEndTime = new Date(prismaCompatibleDtoClone.expectedEndTime);

    const mission = await prisma.mission.create({
        data: {
            ...prismaCompatibleDtoClone,
            drones: {
                connect: createDTO.dronesIds.map(droneId => ({id: droneId})),
            },
        },
    });

    res.status(201).json(mission);
});

router.post('/mission/:id/assign', async (req, res) => {
    const {id} = req.params;
    const {dronesIds} = req.body;

    if (!Array.isArray(dronesIds) || dronesIds.length === 0) {
        res.status(400).json({error: 'dronesIds must be a non-empty array'});
        return;
    }

    try {
        const mission = await prisma.mission.update({
            where: {id},
            data: {
                drones: {
                    connect: dronesIds.map(droneId => ({id: droneId})),
                },
            },
            include: {
                drones: {
                    select: {id: true}
                }
            },
        });

        res.json(mission);
    } catch (err) {
        console.error('Failed to assign drones to mission:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Endpoint to start a mission immediately
router.post('/mission/:id/start-now', async (req, res) => {
    const {id} = req.params;

    try {
        const mission = await prisma.mission.update({
            where: {id},
            data: {startTime: new Date()},
        });

        res.json(mission);
    } catch (err) {
        console.error('Failed to start mission:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

export default router;
