export const typedObjectEntries = <T extends Record<string, unknown>>(
    obj: T,
): [keyof T, T[keyof T]][] => Object.entries(obj) as [keyof T, T[keyof T]][];

export function typedObjectFromEntries<T extends readonly (readonly [string, any])[]>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } {
    return Object.fromEntries(entries) as any;
}

export const typedObjectKeys = <T extends Record<any, any>>(obj: T): Array<keyof T> =>
    Object.keys(obj) as Array<keyof T>;

export const typedObjectValues = <T extends Record<any, any>>(obj: T): Array<T[keyof T]> =>
    Object.values(obj) as Array<T[keyof T]>;
