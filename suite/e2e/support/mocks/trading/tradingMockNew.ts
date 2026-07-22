import { Page } from '@playwright/test';
import type { ExchangeTrade } from 'invity-api';

import type { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { TradingChainBackend, createTradingChainBackend } from './tradingChainBackend';
import { invityEndpoint } from '../../../fixtures/invity';
import { step } from '../../common';

type TradeFlow = 'buy' | 'sell' | 'swap';
type InvityEndpoints = {
    readonly trade: string;
    readonly watch: string;
};

const INVITY_ENDPOINTS: Record<TradeFlow, InvityEndpoints> = {
    buy: { trade: invityEndpoint.buyTrade, watch: invityEndpoint.buyWatch },
    sell: { trade: invityEndpoint.sellTrade, watch: invityEndpoint.sellWatch },
    swap: { trade: invityEndpoint.swapTrade, watch: invityEndpoint.swapWatch },
};

const WATCH_POLL_PERIOD = '00:30';
const WATCH_POLL_TIMEOUT = 35_000;
const ADVANCE_ATTEMPTS = 5;

const assertPassphraseEnv = () => {
    if (!process.env.PASSPHRASE) {
        throw new Error(
            'PASSPHRASE not provided in env variables. Check suite/e2e/docs/e2e-playwright-suite.md.',
        );
    }
};

// Trading e2e mock for tests running against live backends and the live Invity API.
// Everything passes through untouched except the transaction broadcast (blocked by the
// custom backend so no funds ever leave the account) and the post-send watch status
// (mocked, since the provider never receives the blocked payment so it would never progress).
//
// `New` is transient: it coexists with the legacy page.route-based `TradingMock` during the
// migration and is renamed once the legacy one is gone (see e2e-mocking-target-state.md).
export class TradingMockNew {
    private flow?: TradeFlow;
    private backend?: TradingChainBackend;
    private liveTrade: ExchangeTrade | null = null;

    constructor(private page: Page) {
        assertPassphraseEnv();
    }

    // Required; call once in beforeEach — the status/redirect/backend methods guard on it.
    setTradeFlow(flow: TradeFlow) {
        this.flow = flow;
    }

    private get tradeFlow(): TradeFlow {
        if (!this.flow) {
            throw new Error(
                'TradingMockNew: setTradeFlow(...) must be called first (in beforeEach).',
            );
        }

        return this.flow;
    }

    private get endpoints(): InvityEndpoints {
        return INVITY_ENDPOINTS[this.tradeFlow];
    }

    // Sell + swap only (buy has no on-chain send); blocks the broadcast. Call before discovery.
    @step()
    async startBackend(symbol: NetworkSymbol): Promise<{ type: BackendType; url: string }> {
        this.backend = createTradingChainBackend(symbol);
        this.backend.blockBroadcast();
        await this.backend.start();

        return { type: this.backend.backendType, url: this.backend.url };
    }

    // Buy + sell only (swap has no provider redirect); rewrites the live redirect back into Suite.
    @step()
    async rewriteTradeRedirect() {
        if (this.tradeFlow === 'swap') {
            throw new Error('rewriteTradeRedirect is buy/sell only; swap has no provider redirect');
        }

        await this.page.route(this.endpoints.trade, async route => {
            const response = await route.fetch();
            const body = await response.json();
            const { returnUrl } = route.request().postDataJSON();
            body.trade.partnerData = returnUrl;
            body.tradeForm.form.formAction = returnUrl;
            await route.fulfill({ response, json: body });
        });
    }

    // Capture the live trade (real deposit address); arm before the request, await after.
    async waitForLiveTrade(): Promise<ExchangeTrade> {
        const response = await this.page.waitForResponse(this.endpoints.trade);
        this.liveTrade = (await response.json()) as ExchangeTrade;

        return this.liveTrade;
    }

    get liveTradeSendAddress() {
        if (!this.liveTrade?.sendAddress) {
            throw new Error('Live trade response was not captured yet');
        }

        return this.liveTrade.sendAddress;
    }

    // Pin the status the app sees now (the baseline, set at/just before the send).
    @step()
    async setStatus(status: string) {
        await this.routeWatch(status);
    }

    // Fast-forward the clock until a poll returns the target status; retry past stale polls.
    @step()
    async advanceStatus(status: string) {
        await this.routeWatch(status);

        for (let attempt = 0; attempt < ADVANCE_ATTEMPTS; attempt++) {
            const watchResponsePromise = this.page
                .waitForResponse(this.endpoints.watch, { timeout: WATCH_POLL_TIMEOUT })
                .catch(() => null);
            await this.page.clock.fastForward(WATCH_POLL_PERIOD);

            const response = await watchResponsePromise;
            if (response && (await response.json()).status === status) {
                return;
            }
        }

        throw new Error(`Watch response with status ${status} was not observed`);
    }

    async stop() {
        await this.backend?.stop();
    }

    private async routeWatch(status: string) {
        await this.page.route(this.endpoints.watch, async route => {
            await route.fulfill({ json: { status, sendAddress: this.liveTrade?.sendAddress } });
        });
    }
}
