// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/objectUtils.js

export function clone<T>(obj: T): T {
    const jsonString = JSON.stringify(obj);
    if (jsonString === undefined) {
        // jsonString === undefined IF and only IF obj === undefined
        // therefore no need to clone
        return obj;
    }
    return JSON.parse(jsonString);
}

export function entries<T>(obj: { [key: string]: T }): Array<[string, T]> {
    const keys: string[] = Object.keys(obj);
    return keys.map(key => [key, obj[key]]);
}

export function deepClone(_obj: any, _hash: any = new WeakMap()) {
    // if (Object(obj) !== obj) return obj; // primitives
    // if (hash.has(obj)) return hash.get(obj); // cyclic reference
    // const result = Array.isArray(obj) ? [] : obj.constructor ? new obj.constructor() : Object.create(null);
    // hash.set(obj, result);
    // if (obj instanceof Map) { Array.from(obj, ([key, val]) => result.set(key, deepClone(val, hash))); }
    // return Object.assign(result, ...Object.keys(obj).map(
    //     key => ({ [key]: deepClone(obj[key], hash) })));
}

export function snapshot(obj: any) {
    if (obj == null || typeof obj !== 'object') {
        return obj;
    }

    const temp = new obj.constructor();
    Object.keys(temp).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            temp[key] = snapshot(obj[key]);
        }
    });
    return temp;
}

export function objectValues<X>(object: { [key: string]: X }): X[] {
    return Object.keys(object).map(key => object[key]);
}
