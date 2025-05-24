import {prisma} from "./prisma";

import express from 'express';
import {CreateMissionDTO} from "./restDto";
import {validateDto} from "./utils";
import {droneTaskListener} from "./drones";

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

router.get('/missions', async (req, res) => {
    try {
        const missions = await prisma.mission.findMany({
            include: {
                drones: {
                    select: {id: true}
                }
            }
        });
        res.json(missions);
    } catch (err) {
        console.error('Failed to fetch missions:', err);
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

// Gets flight permit for all drones assigned to the mission
router.post('/mission/:id/get-flight-permit', async (req, res) => {
    const missionId = req.params.id;

    const dronesIds = await prisma.mission.findUnique({
        where: {id: missionId},
        select: {
            drones: {
                select: {id: true}
            }
        }
    }).then(mission => mission?.drones.map(drone => drone.id) || []);

    if (dronesIds.length === 0) {
        res.status(200).json({message: 'No drones assigned to this mission.'});
        return;
    }

    dronesIds.forEach(id => {
        droneTaskListener.emit(id, {type: 'toDron:getFlightPermit'});
    });
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
