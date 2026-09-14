import type { MessageTypes, Response } from '@trezor/blockchain-link-types';
import { CustomError, MESSAGES } from '@trezor/blockchain-link-types';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { getSuiteVersion, isDesktop, isNative } from '@trezor/env-utils';
import stellar from '@trezor/network-stellar/runtime';
import type { StellarAPI } from '@trezor/network-stellar/types';
import { createLazy } from '@trezor/utils';

import { BaseWorker } from '../baseWorker';
import { estimateFee } from './handlers/estimateFee';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getInfo } from './handlers/getInfo';
import { pushTransaction } from './handlers/pushTransaction';
import { subscribe } from './handlers/subscribe';
import { unsubscribe } from './handlers/unsubscribe';
import { unsubscribeBlock } from './subscriptions/block';
import type { Request } from './types';

const onRequest = (request: Request<MessageTypes.Message>, isTestnet: boolean) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request, isTestnet);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request, isTestnet);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request, isTestnet);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

export class StellarWorker extends BaseWorker<StellarAPI> {
    private lazyTokens = createLazy(() => utils.getTokenMetadata());
    private isTestnet = false;

    protected isConnected(api: StellarAPI | undefined): api is StellarAPI {
        return !!api;
    }

    async tryConnect(url: string): Promise<StellarAPI> {
        const { getStellarConnection } = await stellar();
        const { api, isTestnet } = await getStellarConnection(
            url,
            isDesktop() || isNative() ? `Trezor Suite ${getSuiteVersion()}` : undefined,
        );

        this.isTestnet = isTestnet;

        return api;
    }

    disconnect() {
        if (!this.api) {
            return;
        }

        unsubscribeBlock({
            state: this.state,
            connect: () => this.connect(),
            post: (data: Response) => this.post(data),
            getTokenMetadata: this.lazyTokens.getOrInit,
        });

        this.api = undefined;
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
                getTokenMetadata: this.lazyTokens.getOrInit,
            };

            const response = await onRequest(request, this.isTestnet);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}
