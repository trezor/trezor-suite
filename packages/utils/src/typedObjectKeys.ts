export const typedObjectKeys = <T extends Record<any, any>>(obj: T): Array<keyof T> =>
    Object.keys(obj) as Array<keyof T>;
