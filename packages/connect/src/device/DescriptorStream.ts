// original file https://github.com/trezor/connect/blob/develop/src/js/device/DescriptorStream.js

// This file reads descriptor with very little logic, and sends it to layers above

import EventEmitter from 'events';
import type { Transport, TrezorDeviceInfoWithSession as DeviceDescriptor } from '@trezor/transport';
import { TRANSPORT } from '../events/transport';
import { DEVICE } from '../events/device';

import { initLog } from '../utils/debug';
import { DataManager } from '../data/DataManager';
import { resolveAfter } from '../utils/promiseUtils';

export type DeviceDescriptorDiff = {
    didUpdate: boolean;
    connected: DeviceDescriptor[];
    disconnected: DeviceDescriptor[];
    changedSessions: DeviceDescriptor[];
    changedDebugSessions: DeviceDescriptor[];
    acquired: DeviceDescriptor[];
    debugAcquired: DeviceDescriptor[];
    released: DeviceDescriptor[];
    debugReleased: DeviceDescriptor[];
    descriptors: DeviceDescriptor[];
};

// custom log
const logger = initLog('DescriptorStream');

const getDiff = (
    current: DeviceDescriptor[],
    descriptors: DeviceDescriptor[],
): DeviceDescriptorDiff => {
    const connected = descriptors.filter(d => current.find(x => x.path === d.path) === undefined);
    const disconnected = current.filter(
        d => descriptors.find(x => x.path === d.path) === undefined,
    );
    const changedSessions = descriptors.filter(d => {
        const currentDescriptor = current.find(x => x.path === d.path);
        if (currentDescriptor) {
            // return currentDescriptor.debug ? (currentDescriptor.debugSession !== d.debugSession) : (currentDescriptor.session !== d.session);
            return currentDescriptor.session !== d.session;
        }
        return false;
    });
    const acquired = changedSessions.filter(d => typeof d.session === 'string');
    const released = changedSessions.filter(
        d =>
            // const session = descriptor.debug ? descriptor.debugSession : descriptor.session;
            typeof d.session !== 'string',
    );

    const changedDebugSessions = descriptors.filter(d => {
        const currentDescriptor = current.find(x => x.path === d.path);
        if (currentDescriptor) {
            return currentDescriptor.debugSession !== d.debugSession;
        }
        return false;
    });
    const debugAcquired = changedSessions.filter(d => typeof d.debugSession === 'string');
    const debugReleased = changedSessions.filter(d => typeof d.debugSession !== 'string');

    const didUpdate =
        connected.length +
            disconnected.length +
            changedSessions.length +
            changedDebugSessions.length >
        0;

    return {
        connected,
        disconnected,
        changedSessions,
        acquired,
        released,
        changedDebugSessions,
        debugAcquired,
        debugReleased,
        didUpdate,
        descriptors,
    };
};

export class DescriptorStream extends EventEmitter {
    // actual low-level transport, from trezor-link
    transport: Transport;

    // if the transport works
    listening = false;

    // if transport fetch API rejects (when computer goes to sleep)
    listenTimestamp = 0;

    // null if nothing
    current: DeviceDescriptor[] | null = null;

    upcoming: DeviceDescriptor[] = [];

    constructor(transport: Transport) {
        super();
        this.transport = transport;
    }

    // emits changes
    async listen() {
        // if we are not enumerating for the first time, we can let
        // the transport to block until something happens
        const waitForEvent = this.current !== null;
        const current: DeviceDescriptor[] = this.current || [];

        this.listening = true;

        let descriptors: DeviceDescriptor[];
        try {
            logger.debug('Start listening', current);
            this.listenTimestamp = new Date().getTime();
            descriptors = waitForEvent
                ? await this.transport.enumerate(current)
                : await this.transport.enumerate();
            if (this.listening && !waitForEvent) {
                // enumerate returns some value
                // TRANSPORT.START will be emitted from DeviceList after device will be available (either acquired or unacquired)
                if (descriptors.length > 0 && DataManager.getSettings('pendingTransportEvent')) {
                    this.emit(TRANSPORT.START_PENDING, descriptors.length);
                } else {
                    this.emit(TRANSPORT.START);
                }
            }
            if (!this.listening) return; // do not continue if stop() was called

            this.upcoming = descriptors;
            logger.debug('Listen result', descriptors);
            this._reportChanges();
            // TODO(karliatto): HERE!!! this is for some reason trigger and trigger here so it should stop to allow continuation.
            if (this.listening) this.listen(); // handlers might have called stop()
        } catch (error) {
            const time = new Date().getTime() - this.listenTimestamp;
            logger.debug('Listen error', 'timestamp', time, typeof error);

            if (time > 1100) {
                await resolveAfter(1000, null);
                if (this.listening) this.listen();
            } else {
                logger.warn('Transport error');
                this.emit(TRANSPORT.ERROR, error);
            }
        }
    }

    async enumerate() {
        if (!this.listening) return;
        try {
            this.upcoming = await this.transport.enumerate();
            this._reportChanges();
        } catch (error) {
            // empty
        }
    }

    stop() {
        this.listening = false;
        this.removeAllListeners();
    }

    _reportChanges() {
        const diff = getDiff(this.current || [], this.upcoming);
        this.current = this.upcoming;

        if (diff.didUpdate && this.listening) {
            diff.connected.forEach(d => {
                this.emit(DEVICE.CONNECT, d);
            });
            diff.disconnected.forEach(d => {
                this.emit(DEVICE.DISCONNECT, d);
            });
            diff.acquired.forEach(d => {
                this.emit(DEVICE.ACQUIRED, d);
            });
            diff.released.forEach(d => {
                this.emit(DEVICE.RELEASED, d);
            });
            diff.changedSessions.forEach(d => {
                this.emit(DEVICE.CHANGED, d);
            });
            this.emit(TRANSPORT.UPDATE, diff);
        }
    }
}
