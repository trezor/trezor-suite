export const typedObjectKeys = <T extends Record<any, any>>(
    obj: T,
): Array<T extends T ? keyof T : never> =>
    // eslint-disable-next-line local-rules/no-object-keys
     Object.keys(obj) as Array<T extends T ? keyof T : never>
;
