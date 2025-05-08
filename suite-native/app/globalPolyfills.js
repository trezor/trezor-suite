// Attempt to fix broken Hermes engine TypedArray implementation for React Native
// See https://github.com/ExodusMovement/patch-broken-hermes-typed-arrays
import '@exodus/patch-broken-hermes-typed-arrays';
import { install } from 'react-native-quick-crypto';

import { CustomEvent } from '@whatwg-node/events'; // to work with @solana/kit
import { Event, EventTarget } from 'event-target-shim'; // to work with @solana/kit
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'; // to work with @solana/kit

// Event, EventTarget and CustomEvent are needed for @solana/kit to work
globalThis.Event = Event;
globalThis.EventTarget = EventTarget;
globalThis.CustomEvent = CustomEvent;

// polyfill for `abortcontroller-polyfill`, which throws DOMException at occasions, and it'd crash the app
if (typeof DOMException === 'undefined') {
    global.DOMException = class DOMException extends Error {};
}

// Ensures that crypto functions required by Solana and device authenticity check are available.
install();

// The Buffer implementation from react-native-quick-crypto is not compatible with Trezor Connect.
global.Buffer = require('buffer').Buffer;

global.process = {
    ...require('process'),
    // necessary to prevent overriding env variables
    env: process.env,
};
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
