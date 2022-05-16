// Abstract class extended by WorkerModule (see /src/workers/*/index.ts)
// Provides an interface of WorkerGlobalScope to behave as regular WebWorker (see /src/index.ts)
// Goal is to Make no difference from the implementation point of view between:
// new BlockchainLink({ worker: () => new Worker('path-to-file.js') });
// and
// new BlockchainLink({ worker: () => new BlockchainLinkModule() });

import * as SocksProxyAgent from 'socks-proxy-agent';
import { CustomError } from '../constants/errors';
import { WorkerState } from './state';
import { MESSAGES, RESPONSES } from '../constants';
import type { Message, Response, BlockchainSettings } from '../types';

// self is not declared in TS Webworker lib typings
declare const self: { postMessage: (...args: any[]) => any };

// detect if script is running in worker context
export const CONTEXT =
    (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) ||
    typeof importScripts !== 'undefined'
        ? 'worker'
        : 'main';

export type ContextType<API> = {
    connect: () => Promise<API>;
    post: (r: Response) => void;
    state: WorkerState;
};

const shuffleEndpoints = (a: string[]) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export abstract class BaseWorker<API> {
    api: API | undefined;
    proxyAgent: ReturnType<typeof SocksProxyAgent> | undefined;
    settings: Partial<BlockchainSettings> = {};
    state: WorkerState;
    post: (data: Response) => void;

    constructor() {
        if (CONTEXT === 'worker') {
            // post will be processed by WorkerGlobalScope interface
            this.post = (data: Response) => self.postMessage(data);
        } else {
            // post will be processed in handler provided by src/index
            this.post = (data: Response) => this.onmessage({ data });
        }

        this.state = new WorkerState();

        // send handshake to src/index
        // timeout is required, onmessage handler is set after initialization
        setTimeout(() => {
            this.post({ id: -1, type: MESSAGES.HANDSHAKE });
        }, 10);
    }

    debug(...args: any[]) {
        if (!this.settings.debug) return;
        const debugPrefix = `[Worker "${this.settings.name}"]:`;
        const fn: keyof typeof console = args[0];
        if (fn === 'warn' || fn === 'error') {
            // eslint-disable-next-line no-console
            console[fn](debugPrefix, ...args.slice(1));
        } else {
            // eslint-disable-next-line no-console
            console.log(debugPrefix, ...args);
        }
    }

    cleanup() {
        this.api = undefined;

        this.state.cleanup();
    }

    protected abstract isConnected(api: API | undefined): api is API;

    protected abstract tryConnect(url: string): Promise<API>;

    async connect(): Promise<API> {
        if (this.isConnected(this.api)) return this.api;

        const { server } = this.settings;
        if (!server || !Array.isArray(server) || server.length < 1) {
            throw new CustomError('connect', 'Endpoint not set');
        }

        const endpoints = shuffleEndpoints(server.slice(0));
        for (let i = 0; i < endpoints.length; ++i) {
            const url = endpoints[i];

            // @sentry/node (used in suite-desktop) is wrapping each outgoing request
            // and requires protocol to be explicitly set to https while using TOR + https/wss address combination
            if (this.proxyAgent) {
                this.proxyAgent.protocol = /^(https|wss):/.test(url) ? 'https:' : 'http:';
            }

            this.debug('Connecting to', url);

            // eslint-disable-next-line no-await-in-loop
            const api = await this.tryConnect(url)
                .then(api => {
                    this.debug('Connected');
                    return api;
                })
                .catch(error => {
                    this.debug('Connection failed', error);
                    return undefined;
                });

            if (api) {
                this.api = api;
                return api;
            }
        }

        throw new CustomError('connect', 'All backends are down');
    }

    disconnect() {
        // override by src/workers/*/index
    }

    // handle common messages and return true if processed.
    // other messages are handled by each WorkerModule separately
    async messageHandler(event: { data: Message }) {
        if (!event.data) return true;
        const { data } = event;
        const { id } = data;

        this.debug('onmessage', data);

        if (data.type === MESSAGES.HANDSHAKE) {
            this.settings = data.settings;
            this.proxyAgent = data.settings.proxy
                ? SocksProxyAgent(data.settings.proxy)
                : undefined;
            return true;
        }
        if (data.type === MESSAGES.CONNECT) {
            await this.connect();
            this.post({ id, type: RESPONSES.CONNECT, payload: true });
            return true;
        }
        if (data.type === MESSAGES.DISCONNECT) {
            this.disconnect();
            this.post({ id, type: RESPONSES.DISCONNECTED, payload: true });
            return true;
        }
        if (data.type === MESSAGES.TERMINATE) {
            this.disconnect();
            this.cleanup();
            return true;
        }
    }

    errorResponse(id: number, error: unknown) {
        const payload = { code: '', message: '' };
        if (error instanceof Error) {
            payload.message = error.message;
            payload.code = error instanceof CustomError && error.code ? error.code : '';
        }
        this.post({
            id,
            type: RESPONSES.ERROR,
            payload,
        });
    }

    // WorkerGlobalScope interface methods used ONLY in module context
    postMessage(data: Message) {
        this.messageHandler({ data });
    }

    onmessage(_evt: { data: Response }) {
        // override by src/index
    }
    onmessageerror(_error: Error) {
        // override by src/index
    }
    onerror(_error: Error) {
        // override by src/index
    }

    terminate() {
        this.postMessage({ id: -1, type: MESSAGES.TERMINATE });
    }
}
