export function typedObjectFromEntries<T extends readonly (readonly [string, any])[]>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } {
    return Object.fromEntries(entries) as any;
}
