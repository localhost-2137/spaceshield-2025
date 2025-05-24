import {ClassConstructor, plainToInstance} from "class-transformer";
import {validateOrReject} from "class-validator";

export async function validateDto<T>(cls: ClassConstructor<any>, obj: T): Promise<T> {
    const instance = plainToInstance(cls, obj);
    await validateOrReject(instance);
    return instance;
}
