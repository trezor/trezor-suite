import { versionUtils, createTimeoutPromise, createDeferred } from '@trezor/utils';

import { request as http } from '../utils/http';
import * as check from '../utils/highlevel-checks';
import { buildOne } from '../lowlevel/send';
import { receiveOne } from '../lowlevel/receive';
import { Transport, AcquireInput } from './abstract';
import * as ERRORS from '../errors';

export const DEFAULT_URL = 'http://127.0.0.1:21325';
// todo: DEFAULT_VERSION_URL is not really used anywhere in production at the moment
// export const DEFAULT_VERSION_URL = 'https://data.trezor.io/bridge/latest.txt';

type IncompleteRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
    abortable?: boolean;
};

// temporary for debugging.
let id = 0;

type BridgeConstructorParameters = ConstructorParameters<typeof Transport>[0] & {
    // bridge url
    url?: string;
    latestVersion?: string;
};
export class BridgeTransport extends Transport {
    latestVersion?: string;
    url: string;

    constructor({ messages, url = DEFAULT_URL, latestVersion }: BridgeConstructorParameters = {}) {
        super({ messages });
        this.name = 'BridgeTransport';
        this.url = url;
        this.latestVersion = latestVersion;
    }

    async init() {
        try {
            const infoS = await http({
                url: this.url,
                method: 'POST',
                // @ts-expect-error
                signal: this.abortController.signal,
            });
            const info = check.info(infoS);
            this.version = info.version;

            if (this.latestVersion) {
                this.isOutdated = versionUtils.isNewer(this.latestVersion, this.version);
            }

            return {
                success: true,
            };
        } catch (err) {
            return {
                success: false,
                message: err.message,
            };
        }
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L373
    listen() {
        if (this.listening) {
            throw new Error(ERRORS.ALREADY_LISTENING);
        }

        this.listening = true;
        this._listen();
    }

    private async _listen(): Promise<void> {
        if (this.stopped) {
            return;
        }
        const listenTimestamp = new Date().getTime();

        try {
            const devicesS = await this._post({
                url: '/listen',

                body: this.descriptors,
                // @ts-expect-error
                signal: this.abortController.signal,
            });
            const descriptors = check.devices(devicesS);

            if (this.acquirePromise?.promise) {
                await this.acquirePromise.promise;
            }

            this.handleDescriptorsChange(descriptors);
            return this._listen();
        } catch (err) {
            if (err.type === 'aborted') {
                return;
            }
            // todo:
            // distinguish errors maybe? maybe this time mechanism is not a good one?
            // maybe we only want to listen again in case of timeout? and all others are error?

            const time = new Date().getTime() - listenTimestamp;
            // if it took more than 1100ms for the request to return error, listen again
            // this is most likely expected to handle timeouts of /listen endpoints which are
            // expected?
            if (time > 1100) {
                await createTimeoutPromise(1000);
                return this._listen();
            }
            this.emit('transport-error', err);
        }
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L235
    async enumerate() {
        const devicesS = await this._post({ url: '/enumerate' });
        const devices = check.devices(devicesS);

        return devices;
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L420
    async acquire({ input }: { input: AcquireInput }) {
        const previous = input.previous == null ? 'null' : input.previous;
        const url = `/acquire/${input.path}/${previous}`;

        // listenPromise is resolved on next listen
        this.listenPromise = createDeferred();
        // acquire promise is resolved after acquire returns
        this.acquirePromise = createDeferred();

        const acquireS = await this._post({ url });
        const expectedSessionId = check.acquire(acquireS);

        this.acquiringSession = expectedSessionId;
        this.acquiringPath = input.path;

        if (this.acquirePromise) {
            this.acquirePromise.resolve(undefined);
        }

        if (!this.listenPromise || !this.listening) {
            return expectedSessionId;
        }

        // todo: promise can also reject 'used elsewhere'
        return this.listenPromise.promise.then(() => {
            this.log('acquire listenPromise resolved');
            delete this.listenPromise;

            // this.acquiring = undefined;
            console.log('BRIDGE ACQUIRE RETURN', expectedSessionId);

            return expectedSessionId;
        });
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L354
    async release(session: string, onclose?: boolean) {
        this.releasing = session;
        this.releasePromise = createDeferred();

        const res = this._post(
            {
                url: `/release/${session}`,
            },
            // the only call which is not abortable, we want release call to reach bridge before application unload
            false,
        );
        if (onclose || !this.listening) {
            // we need release request to reach bridge so that bridge state can update
            // otherwise we would risk 'unacquired device' after reloading application
            await createTimeoutPromise(1);
            return;
        }

        await res;

        return this.releasePromise.promise.then(() => {
            console.log('BRIDGE RELEASE RETURN');
        });
    }

    releaseDevice() {
        return Promise.resolve();
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L534
    async call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }) {
        const { messages } = this;
        const o = buildOne(messages, name, data);
        const outData = o.toString('hex');
        const resData = await this._post({
            url: `/call/${session}`,
            body: outData,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(messages, resData);
        return check.call(jsonData);
    }

    async send({
        session,
        name,
        data,
    }: {
        session: string;
        data: Record<string, unknown>;
        name: string;
    }) {
        const { messages } = this;
        const outData = buildOne(messages, name, data).toString('hex');
        await this._post({
            url: `/post/${session}`,
            body: outData,
        });
    }

    async receive({ session }: { session: string }) {
        const { messages } = this;
        const resData = await this._post({
            url: `/read/${session}`,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(messages, resData);
        return check.call(jsonData);
    }

    /**
     * All bridge endpoints use POST methods
     * For documentation, look here: https://github.com/trezor/trezord-go#api-documentation
     */

    // todo: console logs and ids are only for debugging, will be removed
    private _post(options: IncompleteRequestOptions, abortable = true) {
        id++;
        return (id =>
            // todo: temporary
            // eslint-disable-next-line no-async-promise-executor
            new Promise(async (resolve, reject) => {
                try {
                    console.log(id, 'post', options.url);
                    const resp = await http({
                        ...options,
                        // @ts-expect-error
                        signal: abortable ? this.abortController.signal : undefined,
                        method: 'POST',
                        url: this.url + options.url,
                        skipContentTypeHeader: true,
                    });
                    console.log(id, 'resp', resp);

                    // return resp;
                    resolve(resp);
                } catch (err) {
                    if (err.type === 'aborted' || this.stopped) {
                        console.log(id, 'bridge. err swallow, this.stopped', this.stopped, err);
                        // return '';
                        resolve('');
                    } else {
                        console.log(id, 'bridge do not swallow', err.message);
                        reject(err.message);
                        // throw err;
                    }
                }
            }))(id);
    }

    stop() {
        this.stopped = true;
        console.log('!!! BRIDGE STOP !!!');
        this.abortController.abort();
    }
}
