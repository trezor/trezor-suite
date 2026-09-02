import type { MessageTypes, Response } from '@trezor/blockchain-link-types';
import { CustomError, MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { getSuiteVersion } from '@trezor/env-utils';
import { SOLANA_MAINNET_GENESIS_HASH } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type { SolanaAPI } from '@trezor/network-solana/types';
import { type IntervalId, type TimerId } from '@trezor/type-utils';
import { createLazy } from '@trezor/utils';

import { BaseWorker } from '../baseWorker';
import { estimateFee } from './handlers/estimateFee';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getInfo } from './handlers/getInfo';
import { pushTransaction } from './handlers/pushTransaction';
import { subscribe } from './handlers/subscribe';
import { unsubscribe } from './handlers/unsubscribe';
import { abortSubscription, subscribeAccounts } from './subscriptions/accounts';
import type { Context, Request } from './types';

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

// A closed subscription channel is re-established on the same connection - the JSON-RPC
// transport is plain HTTP and keeps working. Delays grow so a backend that keeps closing the
// channel costs one channel per step instead of a rebuilt worker and a re-sync of every account,
// and reset once subscriptions have held for STABLE_SUBSCRIPTION_TIME.
const RESUBSCRIBE_MIN_DELAY = 1000;
const RESUBSCRIBE_MAX_DELAY = 20000;
const STABLE_SUBSCRIPTION_TIME = 30000;

export class SolanaWorker extends BaseWorker<SolanaAPI> {
    protected isConnected(api: SolanaAPI | undefined): api is SolanaAPI {
        return !!api;
    }

    private lazyTokens = createLazy(() => solanaUtils.getTokenMetadata());
    private isTestnet = false;
    private resubscribeTimeout?: TimerId;
    private resubscribeAttempt = 0;
    private resubscribing = false;
    private channelClosed = false;
    private lastAttemptAt?: number;

    private get context(): Context {
        return {
            connect: () => this.connect(),
            post: (data: Response) => this.post(data),
            state: this.state,
            getTokenMetadata: this.lazyTokens.getOrInit,
            onSubscriptionsClosed: () => this.resubscribeAccounts(),
        };
    }

    private resubscribeAccounts() {
        if (!this.api) return;

        // Every subscription of every account reports the same closed channel, and one pass
        // covers them all. Reports arriving while a pass is in flight belong to the subscriptions
        // that pass is opening, so they schedule the next one instead of aborting this one.
        if (this.resubscribing) {
            this.channelClosed = true;

            return;
        }

        const accounts = [...this.state.getAccounts()];
        if (!accounts.length) return;

        accounts.forEach(({ subscriptionId }) => {
            if (subscriptionId != null) abortSubscription(subscriptionId);
        });
        this.state.removeAccounts(accounts);

        const idleLongEnough =
            this.lastAttemptAt === undefined ||
            Date.now() - this.lastAttemptAt >= STABLE_SUBSCRIPTION_TIME;
        if (idleLongEnough) this.resubscribeAttempt = 0;

        const delay = Math.min(
            RESUBSCRIBE_MIN_DELAY * 2 ** this.resubscribeAttempt,
            RESUBSCRIBE_MAX_DELAY,
        );
        this.resubscribeAttempt += 1;
        this.resubscribing = true;

        this.resubscribeTimeout = setTimeout(async () => {
            this.resubscribeTimeout = undefined;
            this.channelClosed = false;
            this.lastAttemptAt = Date.now();
            try {
                await subscribeAccounts(this.context, accounts);
            } catch {
                this.channelClosed = true;
            }
            this.resubscribing = false;
            if (this.channelClosed) this.resubscribeAccounts();
        }, delay);
    }

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

            const request: Request<MessageTypes.Message> = { ...event.data, ...this.context };

            const response = await onRequest(request, this.isTestnet);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }

    disconnect(): void {
        clearTimeout(this.resubscribeTimeout);
        this.resubscribeTimeout = undefined;
        this.resubscribing = false;

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
