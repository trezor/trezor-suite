import { Page } from '@playwright/test';
import type {
    BuyListResponse,
    BuyProviderInfo,
    BuyTrade,
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTrade,
    SellFiatTrade,
    SellListResponse,
    SellProviderInfo,
} from 'invity-api';

import { tradeEndpoint } from '../../../fixtures/trading';

// A trade is created mid-test on demand; the list loads with the page.
const TRADE_TIMEOUT = 90_000;
const LIST_TIMEOUT = 30_000;

// Live responses of the trading API, one group per flow, read off the wire rather than from
// checked-in fixtures - live values differ between runs, and a stale provider list fails hard on
// whichever provider happens to win an offer. Only observes - it never routes, so it cannot
// collide with the routes the trading mock installs. Armed when the fixture is created, so no
// test has to arm anything before the click that triggers the request.
type FlowResponses<TTrade, TList, TProvider> = {
    /** The live trade of this flow. Resolves once the endpoint has answered; re-readable. */
    trade(): Promise<Required<TTrade>>;
    /** The full `list` response - providers plus, for buy/sell, the geo-detected extras. */
    list(): Promise<TList>;
    /** One provider's entry in the live list, found by its internal name. */
    provider(exchange: string): Promise<TProvider>;
    /** The display name of one provider in the live list. */
    companyName(exchange: string): Promise<string>;
};

export type TradingResponses = {
    buy: FlowResponses<BuyTrade, BuyListResponse, BuyProviderInfo>;
    sell: FlowResponses<SellFiatTrade, SellListResponse, SellProviderInfo>;
    swap: FlowResponses<ExchangeTrade, ExchangeListResponse, ExchangeProviderInfo>;
};

type ObservedResponse<T> = { get(): Promise<T> };

const observeJsonResponse = <T>(page: Page, endpoint: string, timeout: number) => {
    let resolveArrival!: (body: T) => void;
    let rejectArrival!: (error: Error) => void;
    const arrived = new Promise<T>((resolve, reject) => {
        resolveArrival = resolve;
        rejectArrival = reject;
    });

    // get() surfaces the rejection; without this it would also raise an unhandled rejection.
    arrived.catch(() => {});

    page.on('response', async response => {
        if (response.url() !== endpoint) return;

        try {
            const body = await response.text();

            if (!response.ok()) {
                throw new Error(`${response.status()} - ${body}`);
            }

            resolveArrival(JSON.parse(body) as T);
        } catch (error) {
            rejectArrival(new Error(`Live response from ${endpoint} failed: ${error}`));
        }
    });

    const get = async () => {
        let timer: ReturnType<typeof setTimeout>;
        const timedOut = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`No response from ${endpoint} within ${timeout}ms`)),
                timeout,
            );
        });

        try {
            return await Promise.race([arrived, timedOut]);
        } finally {
            clearTimeout(timer!);
        }
    };

    return { get };
};

const createFlowResponses = <
    TTrade,
    TList,
    TProvider extends { name: string; companyName: string },
>(
    page: Page,
    endpoints: { trade: string; list: string },
    unwrapTrade: (body: unknown) => Required<TTrade>,
    selectProviders: (list: TList) => TProvider[],
): FlowResponses<TTrade, TList, TProvider> => {
    const tradeResponse: ObservedResponse<unknown> = observeJsonResponse(
        page,
        endpoints.trade,
        TRADE_TIMEOUT,
    );
    const listResponse: ObservedResponse<TList> = observeJsonResponse(
        page,
        endpoints.list,
        LIST_TIMEOUT,
    );

    const provider = async (exchange: string) => {
        const providers = selectProviders(await listResponse.get());
        const found = providers.find(item => item.name === exchange);

        if (!found) {
            throw new Error(
                `Provider "${exchange}" is not in the live list from ${endpoints.list}. Available: ${providers
                    .map(item => item.name)
                    .join(', ')}`,
            );
        }

        return found;
    };

    return {
        trade: async () => unwrapTrade(await tradeResponse.get()),
        list: () => listResponse.get(),
        provider,
        companyName: async exchange => (await provider(exchange)).companyName,
    };
};

// Buy and sell wrap both the trade and the providers in an envelope, swap returns them bare.
const unwrapBareTrade = <T>(body: unknown) => body as Required<T>;
const unwrapTradeEnvelope = <T>(body: unknown) => (body as { trade: Required<T> }).trade;

export const observeTradingResponses = (page: Page): TradingResponses => ({
    buy: createFlowResponses(
        page,
        { trade: tradeEndpoint.buyTrade, list: tradeEndpoint.buyList },
        unwrapTradeEnvelope<BuyTrade>,
        (list: BuyListResponse) => list.providers,
    ),
    sell: createFlowResponses(
        page,
        { trade: tradeEndpoint.sellTrade, list: tradeEndpoint.sellList },
        unwrapTradeEnvelope<SellFiatTrade>,
        (list: SellListResponse) => list.providers,
    ),
    swap: createFlowResponses(
        page,
        { trade: tradeEndpoint.swapTrade, list: tradeEndpoint.swapList },
        unwrapBareTrade<ExchangeTrade>,
        (list: ExchangeListResponse) => list,
    ),
});
