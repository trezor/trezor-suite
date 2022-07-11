import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import { BaseWorker, CONTEXT, ContextType } from '../base';
import { WabiSabiHttpClient } from './clients/WabiSabiHttpClient';
import type { Message, Response } from '../../types';

type Context = ContextType<WabiSabiHttpClient>;
type Request<T> = T & Context;
const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 3 * 60 * 1000;

const onRequest = async (request: Request<Message>): Promise<any> => {
    const api = await request.connect();
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return {
                type: RESPONSES.GET_INFO,
                payload: await api.getServerInfo(),
            };
        case MESSAGES.GET_BLOCK_FILTERS:
            return {
                type: RESPONSES.GET_BLOCK_FLITERS,
                payload: await api.getBlockFilters(request.payload),
            };
        case MESSAGES.ANALYZE_BLOCK_FILTERS:
            return {
                type: RESPONSES.ANALYZE_BLOCK_FLITERS,
                payload: await api.analyzeBlockFiters(request.payload),
            };
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class WabiSabiWorker extends BaseWorker<WabiSabiHttpClient> {
    pingTimeout?: ReturnType<typeof setTimeout>;

    cleanup() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.api) {
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    protected isConnected(api: WabiSabiHttpClient | undefined): api is WabiSabiHttpClient {
        return api?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<WabiSabiHttpClient> {
        const options = {
            url,
            timeout: this.settings.timeout || DEFAULT_TIMEOUT,
        };
        const api = new WabiSabiHttpClient(options);
        await api.connect();

        // Ripple api does set ledger listener automatically

        api.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({ id: -1, type: RESPONSES.CONNECTED });
        return api;
    }

    disconnect() {
        if (this.api) {
            this.api.disconnect();
        }
    }

    async messageHandler(event: { data: Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        } finally {
            if (event.data.type !== MESSAGES.DISCONNECT) {
                // reset timeout
                this.setPingTimeout();
            }
        }
    }

    setPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(
            () => this.onPing(),
            this.settings.pingTimeout || DEFAULT_PING_TIMEOUT,
        );
    }

    async onPing() {
        if (!this.api || !this.api.isConnected()) return;

        if (this.state.hasSubscriptions() || this.settings.keepAlive) {
            try {
                await this.api.getServerInfo();
            } catch (error) {
                this.debug(`Error in timeout ping request: ${error}`);
            }
            // reset timeout
            this.setPingTimeout();
        } else {
            this.api.disconnect();
        }
    }
}

// export worker factory used in src/index
export default function WabiSabi() {
    return new WabiSabiWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new WabiSabiWorker();
    onmessage = module.messageHandler.bind(module);
}
