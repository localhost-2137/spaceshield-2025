import {IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min} from "class-validator";

export class CreateMissionDTO {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(-180)
    @Max(180)
    locationLongitude!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(-90)
    @Max(90)
    locationLatitude!: number;

    @IsNotEmpty()
    @IsNumber()
    startTime!: number;

    @IsOptional()
    @IsNumber()
    expectedEndTime?: number;

    @IsNotEmpty()
    @IsEnum(['rescue', 'reconnaissance', 'assault', 'agriculture', 'delivery'])
    goal!: 'rescue' | 'reconnaissance' | 'assault' | 'agriculture' | 'delivery';

    @IsOptional()
    @IsString({each: true})
    dronesIds: string[] = []; // IDs of drones to assign to this mission
}
