import {IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";

export class CreateMissionDTO {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsNumber()
    locationLongitude!: number;

    @IsNotEmpty()
    @IsNumber()
    locationLatitude!: number;

    @IsNotEmpty()
    @IsNumber()
    startTime!: number;

    @IsOptional()
    @IsNumber()
    expectedEndTime?: number;

    @IsNotEmpty()
    @IsEnum(['rescue', 'reconnaissance', 'assault', 'transport', 'agriculture', 'delivery'])
    goal!: 'rescue' | 'reconnaissance' | 'assault' | 'transport' | 'agriculture' | 'delivery';

    @IsOptional()
    @IsString({each: true})
    dronesIds: string[] = []; // IDs of drones to assign to this mission
}
