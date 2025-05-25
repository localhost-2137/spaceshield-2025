import {DroneSDK, GeneralDroneInfo, MissionDetails, MissionRaportDTO} from 'uber-less-sdk';

// Drone configuration
const generalInfo: GeneralDroneInfo = {
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

// Flight state management
class FlightState {
    currentLat: number = 51.5074; // Starting in London
    currentLon: number = -0.1278;
    batteryLevel: number = 100;
    isFlying: boolean = false;
    currentMission: MissionDetails | null = null;

    constructor() {}
}

const flightState = new FlightState();

// Utility functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateBatteryConsumption(distanceKm: number, speedKmh: number, maxDistanceKm: number): number {
    // Smart battery management - scale consumption so we never run out
    // Battery consumption is relative to max range, ensuring we can always complete the mission
    const consumptionRate = Math.min(80, (distanceKm / maxDistanceKm) * 80); // Max 80% for round trip
    return consumptionRate;
}

function interpolatePosition(startLat: number, startLon: number, endLat: number, endLon: number, progress: number) {
    return {
        lat: startLat + (endLat - startLat) * progress,
        lon: startLon + (endLon - startLon) * progress
    };
}

// SDK callback functions
async function getLocation() {
    return {
        latitude: flightState.currentLat,
        longitude: flightState.currentLon
    };
}

async function getBatteryPercentage() {
    return Math.max(0, Math.min(100, flightState.batteryLevel));
}

async function onMissionDepart(missionDetails: MissionDetails) {
    console.log('🚁 Mission started:', missionDetails.name);
    console.log('📍 Destination:', `${missionDetails.locationLatitude}, ${missionDetails.locationLongitude}`);
    console.log('🎯 Goal:', missionDetails.goal);

    flightState.currentMission = missionDetails;
    flightState.isFlying = true;

    // Start the flight simulation
    await simulateFlight(missionDetails);
}

// Create SDK instance
const sdk = new DroneSDK({
    generalInfo,
    getLocation,
    getBatteryPercentage,
    onMissionDepart,
});

// Flight simulation
async function simulateFlight(mission: MissionDetails) {
    const startLat = flightState.currentLat;
    const startLon = flightState.currentLon;
    const endLat = mission.locationLatitude;
    const endLon = mission.locationLongitude;

    const totalDistance = calculateDistance(startLat, startLon, endLat, endLon);
    const flightSpeed = generalInfo.maxSpeedKmh; // Use full max speed
    const flightTimeHours = totalDistance / flightSpeed;
    const flightTimeMs = flightTimeHours * 60 * 60 * 1000; // Convert to milliseconds
    const totalBatteryNeeded = calculateBatteryConsumption(totalDistance * 2, flightSpeed, generalInfo.maxDistanceKm); // Round trip

    console.log(`📏 Distance to target: ${totalDistance.toFixed(2)} km`);
    console.log(`🚀 Flying at max speed: ${flightSpeed} km/h`);
    console.log(`⏱️ Flight time to destination: ${(flightTimeHours * 60).toFixed(1)} minutes`);
    console.log(`⚡ Battery consumption for round trip: ${totalBatteryNeeded.toFixed(1)}%`);

    // Simulate flight in segments with proper timing
    const segments = 100;
    const segmentDistance = totalDistance / segments;
    const timePerSegment = flightTimeMs / segments;
    const batteryPerSegment = totalBatteryNeeded / (segments * 2); // Divide by 2 for round trip

    console.log('\n🛫 Taking off...');

    for (let i = 0; i <= segments; i++) {
        const progress = i / segments;
        const currentPos = interpolatePosition(startLat, startLon, endLat, endLon, progress);

        flightState.currentLat = currentPos.lat;
        flightState.currentLon = currentPos.lon;
        flightState.batteryLevel -= batteryPerSegment;

        // Ensure battery never goes below safe levels (minimum 10%)
        flightState.batteryLevel = Math.max(10, flightState.batteryLevel);

        if (i % 5 === 0) { // Report every 5 segments
            console.log(`📍 Current position: ${currentPos.lat.toFixed(4)}, ${currentPos.lon.toFixed(4)}`);
            console.log(`🔋 Battery: ${flightState.batteryLevel.toFixed(1)}%`);
            console.log(`✈️ Progress: ${(progress * 100).toFixed(0)}%`);
        }

        // Wait for realistic segment time
        await new Promise(resolve => setTimeout(resolve, Math.min(timePerSegment / 10, 500))); // Scale down for simulation
    }

    console.log('\n🎯 Arrived at destination!');
    console.log('📸 Beginning reconnaissance mission...');

    // Simulate mission execution
    await executeMissionObjective(mission);

    // Return flight
    console.log('\n🔄 Returning to base...');
    await simulateReturnFlight(endLat, endLon, startLat, startLon, flightTimeMs);
}

async function executeMissionObjective(mission: MissionDetails) {
    // Simulate taking photos and gathering intel
    console.log('🔍 Scanning area...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📷 Capturing high-resolution images...');
    flightState.batteryLevel -= 1; // Minor camera usage - ensure we never run out
    flightState.batteryLevel = Math.max(5, flightState.batteryLevel);
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('📊 Analyzing terrain and collecting data...');
    flightState.batteryLevel -= 0.5; // Minor processing power
    flightState.batteryLevel = Math.max(5, flightState.batteryLevel);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mission report
    await generateAndSendReport(mission);
}

async function simulateReturnFlight(startLat: number, startLon: number, endLat: number, endLon: number, originalFlightTimeMs: number) {
    const returnDistance = calculateDistance(startLat, startLon, endLat, endLon);
    const returnTimeHours = returnDistance / generalInfo.maxSpeedKmh;
    const segments = 15;
    const timePerSegment = originalFlightTimeMs / segments;
    const batteryPerSegment = calculateBatteryConsumption(returnDistance, generalInfo.maxSpeedKmh, generalInfo.maxDistanceKm) / segments;

    console.log(`⏱️ Return flight time: ${(returnTimeHours * 60).toFixed(1)} minutes`);

    for (let i = 0; i <= segments; i++) {
        const progress = i / segments;
        const currentPos = interpolatePosition(startLat, startLon, endLat, endLon, progress);

        flightState.currentLat = currentPos.lat;
        flightState.currentLon = currentPos.lon;
        flightState.batteryLevel -= batteryPerSegment;

        // Ensure battery never goes below minimum
        flightState.batteryLevel = Math.max(5, flightState.batteryLevel);

        if (i % 5 === 0) {
            console.log(`🏠 Returning home: ${(progress * 100).toFixed(0)}% complete, Battery: ${flightState.batteryLevel.toFixed(1)}%`);
        }

        await new Promise(resolve => setTimeout(resolve, Math.min(timePerSegment / 10, 300)));
    }

    console.log('\n🏁 Mission completed successfully!');
    console.log(`🔋 Final battery level: ${flightState.batteryLevel.toFixed(1)}%`);
    console.log(`⏱️ Total mission time: ${((Date.now() - flightState.currentMission!.startTime) / 60000).toFixed(1)} minutes`);
    flightState.isFlying = false;
    flightState.currentMission = null;
}

// Generate a base64 image blob (simulating a captured photo)
function generateSimulatedPhoto(): string {
    // This is a minimal 1x1 pixel PNG in base64 (red pixel)
    // In reality, this would be actual image data from the drone's camera
    const miniPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return miniPng;
}

async function generateAndSendReport(mission: MissionDetails) {
    console.log('📝 Generating mission report...');

    // Simulate capturing multiple photos
    const photos: string[] = [];
    for (let i = 0; i < 3; i++) {
        photos.push(generateSimulatedPhoto());
        console.log(`📸 Photo ${i + 1}/3 captured`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const reportContent = `
RECONNAISSANCE MISSION REPORT
============================
Mission ID: ${mission.id}
Mission Name: ${mission.name}
Drone: ${generalInfo.name} (${generalInfo.id})
Timestamp: ${new Date().toISOString()}

MISSION OVERVIEW:
${mission.description}
Goal: ${mission.goal}

LOCATION DATA:
Target Coordinates: ${mission.locationLatitude}, ${mission.locationLongitude}
Area Surveyed: 2.5 km² radius from target point

OBSERVATIONS:
- Weather conditions: Clear visibility, light winds
- Terrain: Mixed urban/rural landscape
- Notable features: Several structures and pathways identified
- Security assessment: No immediate threats detected
- Environmental factors: Normal atmospheric conditions

TECHNICAL DATA:
- Flight altitude: 120m AGL
- Image resolution: 4K quality
- GPS accuracy: ±3m
- Total flight time: ${((Date.now() - mission.startTime) / 60000).toFixed(1)} minutes
- Battery consumption: ${(100 - flightState.batteryLevel).toFixed(1)}%

IMAGES CAPTURED: ${photos.length} high-resolution photographs
- Aerial overview shots
- Detailed area scans
- Point-of-interest documentation

RECOMMENDATIONS:
Mission objectives successfully completed. Area suitable for planned operations.
No significant obstacles or security concerns identified.

Status: MISSION SUCCESSFUL
    `.trim();

    const report: MissionRaportDTO = {
        missionId: mission.id,
        droneId: generalInfo.id,
        reportContent: reportContent,
        imagesBlobBase64: photos
    };

    console.log('📤 Sending mission report to command center...');

    try {
        await sdk.sendMissionRaport(report);
        console.log('✅ Mission report sent successfully!');
        console.log('\n📋 REPORT SUMMARY:');
        console.log(`- Mission: ${mission.name}`);
        console.log(`- Status: Completed Successfully`);
        console.log(`- Photos captured: ${photos.length}`);
        console.log(`- Battery remaining: ${flightState.batteryLevel.toFixed(1)}%`);
    } catch (error) {
        console.error('❌ Failed to send mission report:', error);
    }
}

// Example mission execution
async function runExampleMission() {
    console.log('🚁 SkyWatcher Drone Mission Simulator');
    console.log('=====================================\n');

    // Example mission to Paris
    const exampleMission: MissionDetails = {
        id: 'mission-001',
        name: 'Urban Reconnaissance - Paris',
        description: 'Conduct aerial surveillance of specified urban area for security assessment',
        locationLatitude: 48.8566,  // Paris coordinates
        locationLongitude: 2.3522,
        startTime: Date.now(),
        expectedEndTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
        goal: 'Document infrastructure and assess area security for upcoming operations'
    };

    console.log('🔧 Initializing drone systems...');
    console.log(`📍 Current location: ${flightState.currentLat}, ${flightState.currentLon}`);
    console.log(`🔋 Battery level: ${flightState.batteryLevel}%\n`);

    // Start the mission
    await onMissionDepart(exampleMission);
}

// Run the simulation
//runExampleMission().catch(console.error);
