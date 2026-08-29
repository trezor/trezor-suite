import type { MessageTypes, Response } from '@trezor/blockchain-link-types';
import { CustomError, MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { getSuiteVersion } from '@trezor/env-utils';
import { SOLANA_MAINNET_GENESIS_HASH } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type { SolanaAPI } from '@trezor/network-solana/types';
import { type IntervalId } from '@trezor/type-utils';
import { createLazy } from '@trezor/utils';

import { BaseWorker } from '../baseWorker';
import { estimateFee } from './handlers/estimateFee';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getInfo } from './handlers/getInfo';
import { pushTransaction } from './handlers/pushTransaction';
import { subscribe } from './handlers/subscribe';
import { unsubscribe } from './handlers/unsubscribe';
import { abortSubscription } from './subscriptions/accounts';
import type { Request } from './types';

const onRequest = (request: Request<MessageTypes.Message>, isTestnet: boolean) => {
    switch (request.type) {
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.GET_INFO:
            return getInfo(request, isTestnet);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

export class SolanaWorker extends BaseWorker<SolanaAPI> {
    protected isConnected(api: SolanaAPI | undefined): api is SolanaAPI {
        return !!api;
    }

    private lazyTokens = createLazy(() => solanaUtils.getTokenMetadata());
    private isTestnet = false;

    async tryConnect(url: string): Promise<SolanaAPI> {
        const { getApi } = await solana();
        const api = getApi(url, `Trezor Suite ${getSuiteVersion()}`);

        this.isTestnet = (await api.rpc.getGenesisHash().send()) !== SOLANA_MAINNET_GENESIS_HASH;

        this.post({ id: -1, type: RESPONSES.CONNECTED });

        return api;
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                onNetworkDisconnect: () => {
                    if (this.api) {
                        // Broadcast that we are being disconnected
                        this.post({
                            id: -1,
                            type: RESPONSES.DISCONNECTED,
                            payload: true,
                        });
                    }
                    this.disconnect();
                },
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

    disconnect(): void {
        if (!this.api) {
            return;
        }

        this.state.getAccounts().forEach(a => {
            if (a.subscriptionId != null) {
                abortSubscription(a.subscriptionId);
            }
        });

        if (this.state.getSubscription('block')) {
            const interval = this.state.getSubscription('block') as IntervalId;
            clearInterval(interval);
            this.state.removeSubscription('block');
        }

        this.api = undefined;
    }
}
