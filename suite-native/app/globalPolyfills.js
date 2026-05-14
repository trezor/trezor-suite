// Attempt to fix broken Hermes engine TypedArray implementation for React Native
// See https://github.com/ExodusMovement/patch-broken-hermes-typed-arrays
import '@exodus/patch-broken-hermes-typed-arrays';
import { install as installQuickCryptoPolyfills } from 'react-native-quick-crypto';

import { installPolyfills as installReactNativePolyfills } from '@evolu/react-native/polyfills';
import { CustomEvent } from '@whatwg-node/events'; // to work with @solana/kit
import { Event, EventTarget } from 'event-target-shim'; // to work with @solana/kit
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'; // to work with @solana/kit
// Shimming Set prototype methods
import difference from 'set.prototype.difference';
import intersection from 'set.prototype.intersection';
import isDisjointFrom from 'set.prototype.isdisjointfrom';
import isSubsetOf from 'set.prototype.issubsetof';
import isSupersetOf from 'set.prototype.issupersetof';
import symmetricDifference from 'set.prototype.symmetricdifference';
import union from 'set.prototype.union';
import 'react-native-get-random-values';

// Event, EventTarget and CustomEvent are needed for @solana/kit to work
globalThis.Event = Event;
globalThis.EventTarget = EventTarget;
globalThis.CustomEvent = CustomEvent;

// polyfill for `abortcontroller-polyfill`, which throws DOMException at occasions, and it'd crash the app
if (typeof DOMException === 'undefined') {
    global.DOMException = class DOMException extends Error {};
}

// Ensures that crypto functions required by Solana and device authenticity check are available.
installQuickCryptoPolyfills();

// The Buffer implementation from react-native-quick-crypto is not compatible with Trezor Connect.
global.Buffer = require('buffer').Buffer;

difference.shim();
intersection.shim();
isDisjointFrom.shim();
isSubsetOf.shim();
isSupersetOf.shim();
symmetricDifference.shim();
union.shim();

// Evolu requires Explicit Resource Management polyfills (Symbol.dispose, Symbol.asyncDispose,
// AsyncDisposableStack, etc.) that Hermes doesn't support natively yet.
installReactNativePolyfills();

// Promise.try is an ES2025 feature not yet supported by Hermes, required by @evolu/common.
if (typeof Promise.try !== 'function') {
    Promise.try = function (callbackfn, ...args) {
        return new Promise(resolve => resolve(callbackfn(...args)));
    };
}

// Promise.withResolvers is an ES2024 feature that may not be supported by Hermes.
if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        return { promise, resolve, reject };
    };
}

global.process = {
    ...require('process'),
    // necessary to prevent overriding env variables
    env: process.env,
};
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
