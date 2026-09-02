import { createHash } from 'crypto';
import { type InfoResponse } from 'invity-api';

import coins from './__fixtures__/coins.json';
import platforms from './__fixtures__/platforms.json';
import { tradeApiFixtures } from './__fixtures__/tradeApi';
import { tradeApi } from './tradeApi';

describe('TradeApi', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Error');
    const accountDescriptor = 'test-account';
    tradeApi.createApiKey(accountDescriptor);
    const apiKey = tradeApi.getCurrentApiKey();

    const abortMock = (abortSignal: AbortSignal) =>
        new Promise((_, reject) => {
            abortSignal.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });

    beforeEach(() => {
        global.fetch = jest.fn();

        tradeApi.setServersEnvironment('production');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create an API key', () => {
        const hash = createHash('sha256');
        hash.update(accountDescriptor);
        const expectedApiKey = hash.digest('hex');

        expect(tradeApi.getCurrentApiKey()).toBe(expectedApiKey);
    });

    it('getCurrentAccountDescriptor', () => {
        const descriptor = tradeApi.getCurrentAccountDescriptor();

        expect(descriptor).toEqual('test-account');
    });

    describe('resetCurrentAccount', () => {
        it('should clear the account descriptor', () => {
            tradeApi.resetCurrentAccount();

            expect(tradeApi.getCurrentAccountDescriptor()).toBeUndefined();
        });

        it('should recreate the descriptor and api key after createApiKey is called', () => {
            tradeApi.resetCurrentAccount();
            tradeApi.createApiKey(accountDescriptor);

            expect(tradeApi.getCurrentAccountDescriptor()).toEqual(accountDescriptor);
            expect(typeof tradeApi.getCurrentApiKey()).toBe('string');
        });
    });

    describe('getApiKey', () => {
        it('should return the default API', () => {
            expect(typeof tradeApi['getApiKey']()).toBe('string');
        });

        it('should throw an error when apiKey is not set', () => {
            (tradeApi as any).constructor.apiKey = undefined;

            expect(() => tradeApi['getApiKey']()).toThrow('apiKey not created');

            (tradeApi as any).constructor.apiKey = apiKey; // reset
        });
    });

    it('should handle case when an error is returned from API', async () => {
        const fetchError = {
            error: 'Bad request',
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve(fetchError),
        });

        const info = await tradeApi.getInfo();
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(info).toEqual(fetchError);
    });

    it('should handle error when is not an error message from API', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () =>
                Promise.resolve({
                    errorAPI: 'Bad request',
                }),
        });

        const info = await tradeApi.getInfo();
        expect(consoleSpy).toHaveBeenCalled();
        expect(info).toEqual({ platforms: {}, coins: {}, config: {} });
    });

    describe('getInfo', () => {
        it('should get initial coins and platforms info', async () => {
            const mockInfo: InfoResponse = {
                coins,
                platforms,
                config: {},
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockInfo),
            });

            const info = await tradeApi.getInfo();
            expect(info).toEqual(mockInfo);
        });

        it('should handle fetch info when the response is undefined', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce({
                ok: true,
                json: () => Promise.resolve(undefined),
            });

            const info = await tradeApi.getInfo();
            expect(info).toEqual({ platforms: {}, coins: {}, config: {} });
        });

        it('should handle fetch info when there is error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const info = await tradeApi.getInfo();
            expect(consoleSpy).toHaveBeenCalledWith('[getInfo]', error);
            expect(info).toEqual({ platforms: {}, coins: {}, config: {} });
        });
    });

    describe.each([
        ['getBuyList' as const, 'buy', tradeApiFixtures.buyList, undefined],
        ['getSellList' as const, 'sell', tradeApiFixtures.sellList, undefined],
        ['getExchangeList' as const, 'exchange', tradeApiFixtures.exchangeList, []],
    ])('%s', (method, service, listFixture, returnValue) => {
        it(`should get ${service} list`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(listFixture),
            });

            const list = await tradeApi[method]();
            expect(list).toEqual(listFixture);
        });

        it(`should handle get ${service} list when the response is undefined`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await tradeApi[method]();
            expect(list).toEqual(returnValue);
        });

        it(`should handle get ${service} list when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await tradeApi[method]();
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(list).toEqual(returnValue);
        });
    });

    describe.each([
        [
            'getBuyQuotes' as const,
            'buy',
            tradeApiFixtures.buyQuotes,
            tradeApiFixtures.buyQuotesBody,
        ],
        [
            'getSellQuotes' as const,
            'sell',
            tradeApiFixtures.sellQuotes,
            tradeApiFixtures.sellQuotesBody,
        ],
        [
            'getExchangeQuotes' as const,
            'exchange',
            tradeApiFixtures.exchangeQuotes,
            tradeApiFixtures.exchangeQuotesBody,
        ],
    ])('%s', (method, service, quotesFixture, body) => {
        it(`should get ${service} quotes`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(quotesFixture),
            });

            const quotes = await tradeApi[method](body as any);
            expect(quotes).toEqual(quotesFixture);
        });

        it(`should handle get ${service} quotes when the request is aborted`, async () => {
            const abortController = new AbortController();
            const abortSignal = abortController.signal;

            (global.fetch as jest.Mock).mockImplementationOnce(() => abortMock(abortSignal));

            const quotesPromise = tradeApi[method](body as any, abortSignal);

            abortController.abort();

            expect(await quotesPromise).toBeUndefined();
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it(`should handle get ${service} quotes when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const quotes = await tradeApi[method](body as any);
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(quotes).toEqual(undefined);
        });
    });

    describe.each([
        [
            'doBuyTrade' as const,
            'buy',
            tradeApiFixtures.buyTradeBody,
            tradeApiFixtures.buyTrade,
            {
                trade: {
                    error: 'Error: Error',
                    exchange: 'test-buy',
                },
            },
        ],
        [
            'doSellTrade' as const,
            'sell',
            tradeApiFixtures.sellTradeBody,
            tradeApiFixtures.sellTrade,
            {
                trade: {
                    error: 'Error: Error',
                    exchange: 'test-sell',
                },
            },
        ],
        [
            'doExchangeTrade' as const,
            'exchange',
            tradeApiFixtures.exchangeTradeBody,
            tradeApiFixtures.exchangeTrade,
            {
                error: 'Error: Error',
                exchange: 'test-exchange',
            },
        ],
    ])('%s', (method, service, body, tradeResponse, errorResponse) => {
        it(`should do ${service} trade`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeResponse),
            });

            const trade = await tradeApi[method](body as any);
            expect(trade).toEqual(tradeResponse);
        });

        it(`should handle do ${service} trade when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await tradeApi[method](body as any);
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(trade).toEqual(errorResponse);
        });
    });

    describe.each([
        [
            'buy' as const,
            tradeApiFixtures.buyTradeBody,
            tradeApiFixtures.buyWatchTrade,
            'watchBuyTrade',
        ],
        [
            'sell' as const,
            tradeApiFixtures.sellTradeBody,
            tradeApiFixtures.sellWatchTrade,
            'watchSellFiatTrade',
        ],
        [
            'exchange' as const,
            tradeApiFixtures.exchangeTradeBody,
            tradeApiFixtures.exchangeWatchTrade,
            'watchExchangeTrade',
        ],
    ])('watchTrade', (service, body, response, logPrefix) => {
        it(`should watch ${service} trade`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            const list = await tradeApi.watchTrade(body as any, service, 0);
            expect(list).toEqual(response);
        });

        it(`should handle get ${service} list when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await tradeApi.watchTrade(body as any, service, 0);
            expect(consoleSpy).toHaveBeenCalledWith(`[${logPrefix}]`, error);
            expect(list).toEqual({
                error: 'Error: Error',
            });
        });
    });

    describe('getBuyTradeForm', () => {
        it('should get buy trade form', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeApiFixtures.buyTradeForm),
            });

            const trade = await tradeApi.getBuyTradeForm(tradeApiFixtures.buyTradeFormBody);
            expect(trade).toEqual(tradeApiFixtures.buyTradeForm);
        });

        it(`should handle get buy trade form when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await tradeApi.getBuyTradeForm(tradeApiFixtures.buyTradeFormBody);
            expect(consoleSpy).toHaveBeenCalledWith('[getBuyTradeForm]', error);
            expect(trade).toEqual({ error: 'Error: Error' });
        });
    });

    describe('doSellConfirm', () => {
        it('should do sell confirm', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeApiFixtures.buyTradeForm),
            });

            const trade = await tradeApi.doSellConfirm(tradeApiFixtures.sellTrade);
            expect(trade).toEqual(tradeApiFixtures.buyTradeForm);
        });

        it(`should handle do sell confirm when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await tradeApi.doSellConfirm(tradeApiFixtures.sellTrade);
            expect(consoleSpy).toHaveBeenCalledWith('[doSellConfirm]', error);
            expect(trade).toEqual({ error: 'Error: Error', exchange: 'test-sell' });
        });
    });

    describe('getOTCData', () => {
        it('should do sell confirm', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeApiFixtures.otc),
            });

            const trade = await tradeApi.getOTCData();
            expect(trade).toEqual(tradeApiFixtures.otc);
        });

        it(`should handle do sell confirm when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await tradeApi.getOTCData();
            expect(consoleSpy).toHaveBeenCalledWith('[getOTCData]', error);
            expect(trade).toEqual(undefined);
        });
    });

    describe('getSignedTrade', () => {
        it('should get signed exchange trade', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeApiFixtures.exchangeTradeSigned),
            });

            const trade = await tradeApi.getSignedTrade(
                tradeApiFixtures.createTradeSignatureRequest,
            );
            expect(trade).toEqual(tradeApiFixtures.exchangeTradeSigned);
        });

        it('should get signed sell trade', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(tradeApiFixtures.sellFiatTradeSigned),
            });

            const trade = await tradeApi.getSignedTrade({
                type: 'sell',
                id: 'test-order-id',
                nonce: 'test-nonce',
                outputs: [
                    {
                        address: 'test-address',
                        amount: '100000000',
                    },
                ],
                memoText: 'test-memo',
                sendSlip44: 0,
            });
            expect(trade).toEqual(tradeApiFixtures.sellFiatTradeSigned);
        });

        it('should return undefined when response is undefined', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(undefined),
            });

            const trade = await tradeApi.getSignedTrade(
                tradeApiFixtures.createTradeSignatureRequest,
            );
            expect(trade).toBeUndefined();
        });

        it('should handle error and return undefined', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await tradeApi.getSignedTrade(
                tradeApiFixtures.createTradeSignatureRequest,
            );
            expect(consoleSpy).toHaveBeenCalledWith('[getSignedTrade]', error);
            expect(trade).toBeUndefined();
        });
    });

    it('getCoinLogoUrl', () => {
        const icon = tradeApi.getCoinLogoUrl('bitcoin');

        expect(icon).toEqual('https://exchange.trezor.io/images/coins/suite/bitcoin.svg');
    });

    it('getProviderLogoUrl', () => {
        const icon = tradeApi.getProviderLogoUrl('test.png');

        expect(icon).toEqual('https://exchange.trezor.io/images/exchange/test.png');
    });

    it('getPaymentMethodUrl', () => {
        const icon = tradeApi.getPaymentMethodUrl('creditCard');

        expect(icon).toEqual(
            'https://exchange.trezor.io/images/paymentMethods/suite/creditCard.svg',
        );
    });

    it('setServersEnvironment', () => {
        tradeApi.setServersEnvironment('localhost');

        expect((tradeApi as any).serverEnvironment).toEqual('localhost');
    });

    it('getApiServerUrl', () => {
        const url = tradeApi.getApiServerUrl();

        expect(url).toEqual('https://exchange.trezor.io');
    });

    describe('headers', () => {
        it('should provide X-Suite-Platform header', () => {
            tradeApi.getInfo();

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Suite-Platform': expect.any(String),
                    }),
                }),
            );
        });
    });
});
