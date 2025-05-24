import {DroneSDK, GeneralDroneInfo, MissionDetails} from 'uber-less-sdk';

const generalDroneInfo: GeneralDroneInfo = {
    id: '7914a2f7-a8ff-4314-a294-0b01993037d0',
    name: 'SkyWatcher',
    description: 'A versatile drone for various missions.',
    type: 'air',
    engineType: 'electric',
    maxSpeedKmh: 120,
    maxDistanceKm: 500,
    pricePerHourUSD: 30,
    noiseLevelDb: 60,
    lengthCm: 80,
    widthCm: 80,
    heightCm: 30,
    maxLoadKg: 5,
    specialization: 'reconnaissance',
}

const sdk = new DroneSDK({
    generalInfo: generalDroneInfo,
    getLocation,
    getBatteryPercentage,
    onMissionDepart,
});

async function getLocation() {
    return {latitude: 0, longitude: 0};
}

async function getBatteryPercentage() {
    return 100;
}

async function onMissionDepart(missionDetails: MissionDetails) {
    console.log('Mission started:', missionDetails);
}
