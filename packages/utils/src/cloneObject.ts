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
                // JSON.parse creates "__proto__" as an own key, but assigning it would call the
                // Object.prototype.__proto__ setter and change the prototype of the copy instead.
                Object.defineProperty(clone, key, {
                    value: cloneObject(value, seen),
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            } else {
                clone[key] = cloneObject(value, seen);
            }
        }
    }

    return clone;
};
