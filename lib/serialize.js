/* @flow
 * Generic (de)serialization functions
 */

export function serialize(value: any): any {
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return sArray(value);
        } else if (value instanceof Map) {
            return sMap(value);
        } else if (value instanceof Set) {
            return sSet(value);
        } else {
            return sObject(value);
        }
    } else {
        return value;
    }
}

function sObject(o) { return mapObject(o, serialize); }
function sArray(a) { return a.map(serialize); }
function sMap(m) { return { '#': 'Map', entries: Array.from(m).map(sArray) }; }
function sSet(s) { return { '#': 'Set', entries: Array.from(s).map(sArray) }; }

export function deserialize(value: any): any {
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return dArray(value);
        } else if (value['#'] === 'Map') {
            return dMap(value);
        } else if (value['#'] === 'Set') {
            return dSet(value);
        } else {
            return dObject(value);
        }
    } else {
        return value;
    }
}

function dObject(o) { return mapObject(o, deserialize); }
function dArray(a) { return a.map(deserialize); }
function dMap(o) { return new Map(o.entries.map(dArray)); }
function dSet(o) { return new Set(o.entries.map(dArray)); }

function mapObject(obj, f) {
    let result = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = f(obj[key]);
        }
    }
    return result;
}
