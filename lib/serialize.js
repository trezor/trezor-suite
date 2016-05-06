/* @flow
 * Generic (de)serialization functions
 */

import {
    Map as ImmutableMap,
    Set as ImmutableSet
} from 'immutable';

export function serialize(value: any): any {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return sArray(value);
        } else if (value instanceof ImmutableMap) {
            return sImmutableMap(value);
        } else if (value instanceof ImmutableSet) {
            return sImmutableSet(value);
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
function sArray(a: Array<any>) { return a.map(serialize); }
function sImmutableMap(m: ImmutableMap) { return { '#': 'ImmutableMap', entries: immutableMapToObject(m) }; }
function sImmutableSet(s: ImmutableSet) { return { '#': 'ImmutableSet', entries: sArray(s.toArray()) }; }
function sMap(m: Map) { return { '#': 'Map', entries: mapToObject(m) }; }
function sSet(s: Set) { return { '#': 'Set', entries: sArray(Array.from(s)) }; }

function mapToObject(m: Map): Object {
    let obj = {};
    for (let [k, v] of m) {
        obj[k] = serialize(v);
    }
    return obj;
}

function immutableMapToObject(m: ImmutableMap): Object {
    let obj = {};
    for (let [k, v] of m.entries()) {
        obj[k] = serialize(v);
    }
    return obj;
}

function objectToMap(obj: Object): Map {
    let map = new Map();
    for (let k of Object.keys(obj)) {
        map.set(k, deserialize(obj[k]));
    }
    return map;
}

function objectToImmutableMap(obj: Object): ImmutableMap {
    return new ImmutableMap().withMutations(map => {
        for (let k of Object.keys(obj)) {
            map.set(k, deserialize(obj[k]));
        }
        return map;
    });
}

export function deserialize(value: any): any {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return dArray(value);
        } else if (value['#'] === 'Map') {
            return dMap(value);
        } else if (value['#'] === 'Set') {
            return dSet(value);
        } else if (value['#'] === 'ImmutableMap') {
            return dImmutableMap(value);
        } else if (value['#'] === 'ImmutableSet') {
            return dImmutableSet(value);
        } else {
            return dObject(value);
        }
    } else {
        return value;
    }
}

function dObject(o) { return mapObject(o, deserialize); }
function dArray(a) { return a.map(deserialize); }
function dMap(o): Map { return objectToMap(o.entries); }
function dSet(o): Set { return new Set(dArray(o.entries)); }
function dImmutableMap(o): ImmutableMap { return objectToImmutableMap(o.entries); }
function dImmutableSet(o): ImmutableSet { return new ImmutableSet(dArray(o.entries)); }

let hasOwnProperty = Object.prototype.hasOwnProperty;

function mapObject(obj, f) {
    let result = {};
    for (let key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            result[key] = f(obj[key]);
        }
    }
    return result;
}
