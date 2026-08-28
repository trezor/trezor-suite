import { Page } from '@playwright/test';
import type { CryptoId } from 'invity-api';

import { getSimulatedReceiveAmount } from '@suite-common/trading';
import type { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { TradingChainBackend, createTradingChainBackend } from './tradingChainBackend';
import { tradeEndpoint } from '../../../fixtures/trading';
import { step } from '../../common';

type TxSimulationResult = NonNullable<Parameters<typeof getSimulatedReceiveAmount>[0]>;
type TxSimulationScan = Omit<TxSimulationResult['payload'], 'needsDisclaimer'>;

type TradeFlow = 'buy' | 'sell' | 'swap';
type TradeEndpoints = {
    readonly trade: string;
    readonly watch: string;
    readonly confirm?: string;
};

const TRADE_ENDPOINTS: Record<TradeFlow, TradeEndpoints> = {
    buy: { trade: tradeEndpoint.buyTrade, watch: tradeEndpoint.buyWatch },
    sell: {
        trade: tradeEndpoint.sellTrade,
        watch: tradeEndpoint.sellWatch,
        confirm: tradeEndpoint.sellConfirm,
    },
    swap: { trade: tradeEndpoint.swapTrade, watch: tradeEndpoint.swapWatch },
};

const WATCH_POLL_PERIOD = '00:30';
const WATCH_POLL_TIMEOUT = 35_000;
const ADVANCE_ATTEMPTS = 5;

const TX_SIMULATION_ENDPOINT = /\/evm\/json-rpc\/scan/;

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
    private capturedTxSimulation: TxSimulationResult | null = null;
    private rewriteRedirect = false;
    private mockStatusPage = false;
    private status?: string;
    private watchFields: Record<string, string> = {};

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

    // Txid of the broadcast blocked by the backend (source of truth for post-send assertions).
    get lastBroadcastTxid(): string {
        const txid = this.backend?.lastBroadcastTxid;
        if (!txid) {
            throw new Error('Backend has not recorded a broadcast yet (is startBackend set up?)');
        }

        return txid;
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
    async rewriteProviderRedirect() {
        if (this.tradeFlow === 'swap') {
            throw new Error(
                'rewriteProviderRedirect is buy/sell only; swap has no provider redirect',
            );
        }

        this.rewriteRedirect = true;
        await this.routeTrade();
    }

    @step()
    async mockProviderStatusPage() {
        if (this.tradeFlow !== 'swap') {
            throw new Error('mockProviderStatusPage is swap only');
        }

        this.mockStatusPage = true;
        await this.routeTrade();

        await this.page.context().route(`${MOCK_PROVIDER_STATUS_ORIGIN}/*`, async route => {
            const orderId = route.request().url().split('/').pop() ?? '';
            await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: mockProviderStatusPageHtml(orderId),
            });
        });
    }

    // Amount the last captured simulation credits, derived the same way the confirm step derives
    // the amount it renders. A re-quote refetches the scan, so read this at assertion time.
    simulatedReceiveAmount(receive: CryptoId): string {
        if (!this.capturedTxSimulation) {
            throw new Error(
                'No tx simulation captured - is captureTxSimulation() set up in beforeEach?',
            );
        }

        const amount = getSimulatedReceiveAmount(this.capturedTxSimulation, receive);

        if (!amount) {
            throw new Error(
                'The captured simulation does not credit the receive asset of the trade',
            );
        }

        return amount;
    }

    // DEX only; the confirm step renders the amount the Blockaid simulation credits instead of the
    // amount the trade promised. The scan runs untouched, only its result is kept for assertions.
    @step()
    async captureTxSimulation() {
        await this.page.route(TX_SIMULATION_ENDPOINT, async route => {
            const response = await route.fetch();
            const scan = (await response.json()) as TxSimulationScan;

            this.capturedTxSimulation = {
                method: 'ethereumSignTransaction',
                payload: { ...scan, needsDisclaimer: false },
            };

            await route.fulfill({ response });
        });
    }

    @step()
    async setWatchFields(fields: Record<string, string>) {
        this.watchFields = fields;
        await this.routeStatus();
    }

    @step()
    async setStatus(status: string) {
        this.status = status;
        await this.routeStatus();
    }

    @step()
    async advanceStatus(status: string) {
        this.status = status;
        await this.routeStatus();

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

    private async routeTrade() {
        await this.page.route(this.endpoints.trade, async route => {
            const response = await route.fetch();
            const body = await response.json();

            if (this.rewriteRedirect) {
                const { returnUrl } = route.request().postDataJSON();
                body.trade.partnerData = returnUrl;
                body.tradeForm.form.formAction = returnUrl;
            }

            if (this.mockStatusPage) {
                body.statusUrl = `${MOCK_PROVIDER_STATUS_ORIGIN}/${body.orderId}`;
            }

            await route.fulfill({ response, json: body });
        });
    }

    private async routeStatus() {
        await this.page.route(this.endpoints.watch, async route => {
            await route.fulfill({ json: { status: this.status, ...this.watchFields } });
        });

        const { confirm } = this.endpoints;
        if (!confirm) {
            return; // buy and swap flows have no confirm endpoint
        }

        // Live Invity rejects a confirm carrying an address it never issued and a txid that is not
        // on chain, so the posted trade is echoed back with the status the test is driving.
        await this.page.route(confirm, async route => {
            const trade = route.request().postDataJSON();
            await route.fulfill({ json: { ...trade, status: this.status } });
        });
    }
}
