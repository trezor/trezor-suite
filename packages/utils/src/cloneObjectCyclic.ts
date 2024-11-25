// Makes a deep copy of an object, handling cyclical references.
export const cloneObjectCyclic = <T>(obj: T, seen = new WeakMap<object, any>()): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (seen.has(obj)) {
        return seen.get(obj);
    }

    if (obj instanceof ArrayBuffer) {
        return obj.slice(0) as any;
    }

    if (ArrayBuffer.isView(obj)) {
        const TypedArrayConstructor = obj.constructor as new (...args: any[]) => typeof obj;

        return new TypedArrayConstructor(obj) as any;
    }

    const clone: any = Array.isArray(obj) ? [] : {};
    seen.set(obj, clone);

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = (obj as any)[key];

            if (typeof value === 'function' || typeof value === 'symbol') {
                continue;
            }

            (clone as any)[key] = cloneObjectCyclic(value, seen);
        }
    }

    return clone;
};
