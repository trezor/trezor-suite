/* @flow
 * Generic (de)serialization functions
 */

import {
    Map as ImmutableMap,
    Set as ImmutableSet,
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
function sImmutableMap<V>(m: ImmutableMap<string, V>) { return { '#': 'ImmutableMap', entries: immutableMapToObject(m) }; }
function sImmutableSet<V>(s: ImmutableSet<V>) { return { '#': 'ImmutableSet', entries: sArray(s.toArray()) }; }
function sMap<V>(m: Map<string, V>) { return { '#': 'Map', entries: mapToObject(m) }; }
function sSet<K>(s: Set<K>) { return { '#': 'Set', entries: sArray(Array.from(s)) }; }

function mapToObject<V>(m: Map<string, V>): Object {
    const obj = {};
    for (const [k, v] of m) {
        obj[k] = serialize(v);
    }
    return obj;
}

function immutableMapToObject<V>(m: ImmutableMap<string, V>): Object {
    const obj = {};
    for (const [k, v] of m.entries()) {
        obj[k] = serialize(v);
    }
    return obj;
}

function objectToMap<V>(obj: Object): Map<string, V> {
    const map = new Map();
    for (const k of Object.keys(obj)) {
        map.set(k, deserialize(obj[k]));
    }
    return map;
}

function objectToImmutableMap<V>(obj: Object): ImmutableMap<string, V> {
    return new ImmutableMap().withMutations(map => {
        for (const k of Object.keys(obj)) {
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
function dMap<V>(o): Map<string, V> { return objectToMap(o.entries); }
function dSet<V>(o): Set<V> { return new Set(dArray(o.entries)); }
function dImmutableMap<V>(o): ImmutableMap<string, V> { return objectToImmutableMap(o.entries); }
function dImmutableSet<V>(o): ImmutableSet<V> { return new ImmutableSet(dArray(o.entries)); }

const hasOwnProperty = Object.prototype.hasOwnProperty;

function mapObject(obj, f) {
    const result = {};
    for (const key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            result[key] = f(obj[key]);
        }
    }
    return result;
}
