import { CustomError, MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, Response } from '@trezor/blockchain-link-types';
import { getSuiteVersion } from '@trezor/env-utils';
import xrpl from '@trezor/network-ripple/runtime';
import type { XrplAPI } from '@trezor/network-ripple/types';
import { type TimerId } from '@trezor/type-utils';

import { BaseWorker } from '../baseWorker';
import { DEFAULT_PING_TIMEOUT, DEFAULT_TIMEOUT } from './constants';
import { estimateFee } from './handlers/estimateFee';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getInfo } from './handlers/getInfo';
import { getTransaction } from './handlers/getTransaction';
import { pushTransaction } from './handlers/pushTransaction';
import { subscribe } from './handlers/subscribe';
import { unsubscribe } from './handlers/unsubscribe';
import { RESERVE, updateReserveFromLedger } from './reserve';
import type { Request } from './types';

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_TRANSACTION:
            return getTransaction(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

export class RippleWorker extends BaseWorker<XrplAPI> {
    pingTimeout?: TimerId;

    cleanup() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.api) {
            this.api.removeAllListeners();
        }
        super.cleanup();
    }

    protected isConnected(client: XrplAPI | undefined): client is XrplAPI {
        return client?.isConnected() ?? false;
    }

    async tryConnect(url: string): Promise<XrplAPI> {
        const { getXrplApi } = await xrpl();

        const client = getXrplApi(url, {
            headers: { 'User-Agent': `Trezor Suite ${getSuiteVersion()}` },
            timeout: this.settings.timeout || DEFAULT_TIMEOUT, // timeout is used for request and heartbeat (ping)
            connectionTimeout: this.settings.timeout || DEFAULT_TIMEOUT, // connectionTimeout is used only for connection
            ...(this.proxyAgent && { agent: this.proxyAgent }),
        });

        await client.connect();

        // xrpl API automatically sets a ledger listener
        client.on('ledgerClosed', ledger => {
            // store current ledger values (guarded — see updateReserveFromLedger)
            updateReserveFromLedger(RESERVE, ledger);
        });

        client.on('disconnected', () => {
            this.post({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
            this.cleanup();
        });

        this.post({ id: -1, type: RESPONSES.CONNECTED });

        client.request({
            command: 'subscribe',
            streams: ['ledger'],
        });

        return client;
    }

    async disconnect() {
        try {
            if (this.api?.isConnected()) {
                await this.api.disconnect();
            }
        } catch (error) {
            this.debug('Disconnect failed', error);
        } finally {
            this.cleanup();
        }
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error: unknown) {
            const { asXrplError } = await xrpl();
            const xrplError = asXrplError(error);
            const err = xrplError
                ? new CustomError(
                      xrplError.name === 'TimeoutError'
                          ? 'websocket_timeout'
                          : 'websocket_error_message',
                      xrplError.data
                          ? `${xrplError.name} ${xrplError.data.error_message}`
                          : xrplError.toString(),
                  )
                : error;

            this.errorResponse(event.data.id, err);
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
        this.pingTimeout = this.api?.isConnected()
            ? setTimeout(() => this.onPing(), this.settings.pingTimeout || DEFAULT_PING_TIMEOUT)
            : undefined;
    }

    async onPing() {
        if (!this.api?.isConnected()) return;

        if (this.state.hasSubscriptions() || this.settings.keepAlive) {
            try {
                await this.api.request({ command: 'ping' });
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
