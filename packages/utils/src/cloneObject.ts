// Makes a deep copy of an object.
export const cloneObject = <T>(obj: T, seen = new WeakMap<object, any>()): T => {
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

        return new TypedArrayConstructor(obj);
    }

    const clone: any = Array.isArray(obj) ? [] : {};
    seen.set(obj, clone);

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = (obj as any)[key];

            if (typeof value === 'function' || typeof value === 'symbol') {
                continue;
            }

            if (key === '__proto__') {
                // Assigning this key would set the prototype of the copy instead of adding a property.
                Object.defineProperty(clone, key, {
                    value: cloneObject(value, seen),
                    enumerable: true,
                    writable: true,
                    configurable: true,
                });
            } else {
                clone[key] = cloneObject(value, seen);
            }
        }
    }

    return clone;
};
