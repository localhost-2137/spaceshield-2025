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

export default router;
