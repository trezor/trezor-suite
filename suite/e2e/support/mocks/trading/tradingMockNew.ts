import { Page } from '@playwright/test';
import type { ExchangeTrade } from 'invity-api';

import type { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { TradingChainBackend, createTradingChainBackend } from './tradingChainBackend';
import { tradeEndpoint } from '../../../fixtures/trading';
import { step } from '../../common';

export type CapturedLiveTrade = ExchangeTrade & { sendAddress: string; exchange: string };

type TradeFlow = 'buy' | 'sell' | 'swap';
type TradeEndpoints = {
    readonly trade: string;
    readonly watch: string;
};

const TRADE_ENDPOINTS: Record<TradeFlow, TradeEndpoints> = {
    buy: { trade: tradeEndpoint.buyTrade, watch: tradeEndpoint.buyWatch },
    sell: { trade: tradeEndpoint.sellTrade, watch: tradeEndpoint.sellWatch },
    swap: { trade: tradeEndpoint.swapTrade, watch: tradeEndpoint.swapWatch },
};

const WATCH_POLL_PERIOD = '00:30';
const WATCH_POLL_TIMEOUT = 35_000;
const ADVANCE_ATTEMPTS = 5;

const MOCK_PROVIDER_STATUS_ORIGIN = 'https://mocked.partner.site/orders';
const mockProviderStatusPageHtml = (orderId: string) =>
    `<!DOCTYPE html><html><head><title>Mocked Provider Support</title></head><body><h1>Mocked Provider Support Page</h1><p>Order ID: ${orderId}</p></body></html>`;

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
    private capturedTrade: CapturedLiveTrade | null = null;

    constructor(private page: Page) {
        assertPassphraseEnv();
    }

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

    private get endpoints(): TradeEndpoints {
        return TRADE_ENDPOINTS[this.tradeFlow];
    }

    // Sell + swap only; call before discovery.
    @step()
    async startBackend(symbol: NetworkSymbol): Promise<{ type: BackendType; url: string }> {
        this.backend = createTradingChainBackend(symbol);
        this.backend.blockBroadcast();
        await this.backend.start();

        return { type: this.backend.backendType, url: this.backend.url };
    }

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

    @step()
    async mockProviderStatusPage() {
        if (this.tradeFlow !== 'swap') {
            throw new Error('mockProviderStatusPage is swap only');
        }

        await this.page.route(this.endpoints.trade, async route => {
            const response = await route.fetch();
            const body = await response.json();
            body.statusUrl = `${MOCK_PROVIDER_STATUS_ORIGIN}/${body.orderId}`;
            await route.fulfill({ response, json: body });
        });

        await this.page.context().route(`${MOCK_PROVIDER_STATUS_ORIGIN}/*`, async route => {
            const orderId = route.request().url().split('/').pop() ?? '';
            await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: mockProviderStatusPageHtml(orderId),
            });
        });
    }

    async waitForLiveTrade() {
        const response = await this.page.waitForResponse(this.endpoints.trade);
        const trade = (await response.json()) as ExchangeTrade;
        if (!trade.sendAddress || !trade.exchange) {
            throw new Error('Live trade response is missing sendAddress or exchange');
        }

        this.capturedTrade = trade as CapturedLiveTrade;
    }

    get liveTrade(): CapturedLiveTrade {
        if (!this.capturedTrade) {
            throw new Error('Live trade response was not captured yet');
        }

        return this.capturedTrade;
    }

    @step()
    async setStatus(status: string) {
        await this.routeWatch(status);
    }

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
            await route.fulfill({ json: { status, sendAddress: this.liveTrade.sendAddress } });
        });
    }
}
