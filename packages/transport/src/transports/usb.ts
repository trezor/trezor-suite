import type { WebUSB } from 'usb';
import { createDeferred } from '@trezor/utils';

import { Transport, AcquireInput } from './abstract';
import { TransportUsbInterface } from '../interfaces/usb';
import { buildAndSend } from '../lowlevel/send';
import { receiveAndParse } from '../lowlevel/receive';
import { SessionsClient } from '../sessions/client';
import { MessageFromTrezor } from '../types';
import * as ERRORS from '../errors';

type UsbTransportConstructorParams = ConstructorParameters<typeof Transport>[0] & {
    usbInterface: WebUSB;
    sessionsClient: typeof SessionsClient['prototype'];
};

// todo: Abort controller for usb?

/**
 *
 * Abstract class for transports with direct usb access (webusb, nodeusb).
 *
 */
export class UsbTransport extends Transport {
    // sessions client is a standardized interface for communicating with sessions backend
    // which can live in couple of context (shared worker, local module, websocket server etc)
    private sessionsClient: UsbTransportConstructorParams['sessionsClient'];

    private transportInterface: TransportUsbInterface;

    constructor({ messages, usbInterface, sessionsClient }: UsbTransportConstructorParams) {
        super({ messages });
        this.transportInterface = new TransportUsbInterface({ transportInterface: usbInterface });
        this.sessionsClient = sessionsClient;

        this.abortController.signal.addEventListener('abort', () => {
            // todo: we could consider implementing this but probably later. at the moment
            // we have no unique link between state in sessions background and transport
            // and due to this we can not clean up state in background which is specific to its
            // client
            // this.sessionsClient.abort();
        });
    }

    async init() {
        if (!this.transportInterface) {
            return Promise.resolve({
                success: false,
                message: ERRORS.NATIVE_INTERFACE_NOT_AVAILABLE,
            });
        }

        const handshakeRes = await this.sessionsClient.handshake();

        if ('reason' in handshakeRes) {
            return Promise.reject({
                success: false,
                message: handshakeRes.reason,
            });
        }

        return Promise.resolve({
            success: true,
        });
    }

    listen() {
        if (this.listening) {
            throw new Error(ERRORS.ALREADY_LISTENING);
        }
        if (this.stopped) {
            return;
        }

        this.listening = true;

        // 1. transport interface reports descriptors change
        this.transportInterface.on('transport-interface-change', devices => {
            // 2. we signal this to sessions background
            this.sessionsClient.enumerateDone({
                paths: devices.map(d => d.path),
            });
        });
        // 3. based on 2.sessions background distributes information about descriptors change to all clients
        this.sessionsClient.on('descriptors', descriptors => {
            // 4. we propagate new descriptors to higher levels
            this.handleDescriptorsChange(descriptors);
        });
    }

    async enumerate() {
        // notify sessions background that a client is going to access usb
        await this.sessionsClient.enumerateIntent();

        // enumerate usb interface
        const occupiedPaths = await this.transportInterface.enumerate();

        // inform sessions background about occupied paths and get descriptors back
        const { descriptors } = await this.sessionsClient.enumerateDone({
            paths: occupiedPaths,
        });

        return descriptors;
    }

    async acquire({ input }: { input: AcquireInput }) {
        this.log('acquire', input);

        // listenPromise is resolved on next listen
        this.listenPromise = createDeferred();
        // acquire promise is resolved after acquire returns
        this.acquirePromise = createDeferred();

        const acquireIntentResponse = await this.sessionsClient.acquireIntent(input);

        if (acquireIntentResponse.type === 'nope') {
            // connect expects us to throw here
            throw new Error(acquireIntentResponse.reason);
        }

        this.acquiringPath = input.path;

        const reset = !!input.previous;

        this.log('acquire:acquireIntentResponse', acquireIntentResponse);

        const { path } = input;

        await this.transportInterface.openDevice(path, reset);

        // todo: handle acquire error
        const acquireDonRes = await this.sessionsClient.acquireDone({ path });
        const expectedSessionId = acquireDonRes.session;
        if (!expectedSessionId) {
            // todo: this should not happen, probably could improve types
            throw new Error('acquire: unexpected response');
        }

        this.acquiringSession = expectedSessionId;

        this.log('acquireDoneRes', acquireDonRes);

        if (this.acquirePromise) {
            this.acquirePromise.resolve(undefined);
        }

        if (!this.listenPromise || !this.listening) {
            return expectedSessionId;
        }
        return this.listenPromise.promise.then(() => {
            delete this.listenPromise;
            return expectedSessionId;
        });
    }

    async call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }): Promise<MessageFromTrezor> {
        this.log('call', name);

        const path = await this.ensurePath(session);

        try {
            await buildAndSend(
                this.messages,
                (buffer: Buffer) => this.transportInterface.write(path, buffer),
                name,
                data,
            );

            const message = await receiveAndParse(this.messages!, () =>
                this.transportInterface.read(path),
            );

            return message;
        } catch (err) {
            // if user revokes usb permissions in browser we need a way how propagate that the device was technically disconnected,
            if (err.message === 'NotFoundError: The device was disconnected') {
                this.enumerate();
            }

            throw err;
        }
    }

    async send({
        data,
        session,
        name,
    }: {
        data: Record<string, unknown>;
        session: string;
        name: string;
    }) {
        const path = await this.ensurePath(session);

        await buildAndSend(
            this.messages,
            (buffer: Buffer) => this.transportInterface.write(path, buffer),
            name,
            data,
        );
    }

    async receive({ session }: { session: string }) {
        const path = await this.ensurePath(session);

        const message = await receiveAndParse(this.messages!, () =>
            this.transportInterface.read(path),
        );

        return message;
    }

    // todo: _last not used? maybe not needed..
    async release(session: string, _last: boolean) {
        this.releasing = session;
        this.releasePromise = createDeferred();

        const releaseIntentResponse = await this.sessionsClient.releaseIntent({ session });

        if (releaseIntentResponse.type === 'nope') {
            throw releaseIntentResponse.reason;
        }

        try {
            await this.releaseDevice(releaseIntentResponse.path!);
        } catch (err) {
            this.log('release device.close err', err);
        }

        await this.sessionsClient.releaseDone({
            path: releaseIntentResponse.path!,
        });

        return this.releasePromise.promise;
    }

    private ensurePath = async (session: string) => {
        const { path } = await this.sessionsClient.getPathBySession({ session });
        // todo: this looks ok here, if no path could be extracted from backend sessions
        // we can't call.
        // todo: in the original code this error was 'Session not available' and it happened time to time
        // see related comment in DeviceCommands (promptPassphrase)
        if (!path) {
            // device was not acquired before
            throw new Error('path not found');
        }
        return path;
    };

    async releaseDevice(path: string) {
        return this.transportInterface.closeDevice(path);
    }

    stop() {
        this.transportInterface.on('transport-interface-change', () => {
            this.log('device connected after transport stopped');
        });
        this.stopped = true;
        this.abortController.abort();
    }
}
