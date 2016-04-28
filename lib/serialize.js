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
            return sMap(value);
        } else if (value instanceof ImmutableSet) {
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
function sMap(m: ImmutableMap) { return { '#': 'Map', entries: m.toArray() }; }
function sSet(s: ImmutableSet) { return { '#': 'Set', entries: s.toArray() }; }

export function deserialize(value: any): any {
    if (typeof value === 'object' && value !== null) {
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
function dMap(o): ImmutableMap { return new ImmutableMap(dArray(o.entries)); }
function dSet(o): ImmutableSet { return new ImmutableSet(dArray(o.entries)); }

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
