import { createHash } from 'crypto';
import { InfoResponse } from 'invity-api';

import coins from '../__fixtures__/coins.json';
import { invityAPIFixtures } from '../__fixtures__/invityAPI';
import platforms from '../__fixtures__/platforms.json';
import { invityAPI } from '../invityAPI';

describe('InvityAPI', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Error');
    const accountDescriptor = 'test-account';
    invityAPI.createInvityAPIKey(accountDescriptor);
    const apiKey = invityAPI.getCurrentApiKey();

    const abortMock = (abortSignal: AbortSignal) =>
        new Promise((_, reject) => {
            abortSignal.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });

    beforeEach(() => {
        global.fetch = jest.fn();

        invityAPI.setInvityServersEnvironment('production');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should create an API key', () => {
        const hash = createHash('sha256');
        hash.update(accountDescriptor);
        const expectedApiKey = hash.digest('hex');

        expect(invityAPI.getCurrentApiKey()).toBe(expectedApiKey);
    });

    it('getCurrentAccountDescriptor', () => {
        const descriptor = invityAPI.getCurrentAccountDescriptor();

        expect(descriptor).toEqual('test-account');
    });

    describe('getInvityAPIKey', () => {
        it('should return the default API', () => {
            expect(typeof invityAPI['getInvityAPIKey']()).toBe('string');
        });

        it('should throw an error when apiKey is not set', () => {
            (invityAPI as any).constructor.apiKey = undefined;

            expect(() => invityAPI['getInvityAPIKey']()).toThrow('apiKey not created');

            (invityAPI as any).constructor.apiKey = apiKey; // reset
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

        const info = await invityAPI.getInfo();
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

        const info = await invityAPI.getInfo();
        expect(consoleSpy).toHaveBeenCalled();
        expect(info).toEqual({ platforms: {}, coins: {} });
    });

    describe('getInfo', () => {
        it('should get initial coins and platforms info', async () => {
            const mockInfo: InfoResponse = {
                coins,
                platforms,
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockInfo),
            });

            const info = await invityAPI.getInfo();
            expect(info).toEqual(mockInfo);
        });

        it('should handle fetch info when the response is undefined', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce({
                ok: true,
                json: () => Promise.resolve(undefined),
            });

            const info = await invityAPI.getInfo();
            expect(info).toEqual({ platforms: {}, coins: {} });
        });

        it('should handle fetch info when there is error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const info = await invityAPI.getInfo();
            expect(consoleSpy).toHaveBeenCalledWith('[getInfo]', error);
            expect(info).toEqual({ platforms: {}, coins: {} });
        });
    });

    describe.each([
        ['getBuyList' as const, 'buy', invityAPIFixtures.buyList, undefined],
        ['getSellList' as const, 'sell', invityAPIFixtures.sellList, undefined],
        ['getExchangeList' as const, 'exchange', invityAPIFixtures.exchangeList, []],
    ])('%s', (method, service, listFixture, returnValue) => {
        it(`should get ${service} list`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(listFixture),
            });

            const list = await invityAPI[method]();
            expect(list).toEqual(listFixture);
        });

        it(`should handle get ${service} list when the response is undefined`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await invityAPI[method]();
            expect(list).toEqual(returnValue);
        });

        it(`should handle get ${service} list when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await invityAPI[method]();
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(list).toEqual(returnValue);
        });
    });

    describe.each([
        [
            'getBuyQuotes' as const,
            'buy',
            invityAPIFixtures.buyQuotes,
            invityAPIFixtures.buyQuotesBody,
        ],
        [
            'getSellQuotes' as const,
            'sell',
            invityAPIFixtures.sellQuotes,
            invityAPIFixtures.sellQuotesBody,
        ],
        [
            'getExchangeQuotes' as const,
            'exchange',
            invityAPIFixtures.exchangeQuotes,
            invityAPIFixtures.exchangeQuotesBody,
        ],
    ])('%s', (method, service, quotesFixture, body) => {
        it(`should get ${service} quotes`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(quotesFixture),
            });

            const quotes = await invityAPI[method](body as any);
            expect(quotes).toEqual(quotesFixture);
        });

        it(`should handle get ${service} quotes when the request is aborted`, async () => {
            const abortController = new AbortController();
            const abortSignal = abortController.signal;

            (global.fetch as jest.Mock).mockImplementationOnce(() => abortMock(abortSignal));

            const quotesPromise = invityAPI[method](body as any, abortSignal);

            abortController.abort();

            expect(await quotesPromise).toBeUndefined();
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it(`should handle get ${service} quotes when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const quotes = await invityAPI[method](body as any);
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(quotes).toEqual(undefined);
        });
    });

    describe.each([
        [
            'doBuyTrade' as const,
            'buy',
            invityAPIFixtures.buyTradeBody,
            invityAPIFixtures.buyTrade,
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
            invityAPIFixtures.sellTradeBody,
            invityAPIFixtures.sellTrade,
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
            invityAPIFixtures.exchangeTradeBody,
            invityAPIFixtures.exchangeTrade,
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

            const trade = await invityAPI[method](body as any);
            expect(trade).toEqual(tradeResponse);
        });

        it(`should handle do ${service} trade when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await invityAPI[method](body as any);
            expect(consoleSpy).toHaveBeenCalledWith(`[${method}]`, error);
            expect(trade).toEqual(errorResponse);
        });
    });

    describe.each([
        [
            'buy' as const,
            invityAPIFixtures.buyTradeBody,
            invityAPIFixtures.buyWatchTrade,
            'watchBuyTrade',
        ],
        [
            'sell' as const,
            invityAPIFixtures.sellTradeBody,
            invityAPIFixtures.sellWatchTrade,
            'watchSellFiatTrade',
        ],
        [
            'exchange' as const,
            invityAPIFixtures.exchangeTradeBody,
            invityAPIFixtures.exchangeWatchTrade,
            'watchExchangeTrade',
        ],
    ])('watchTrade', (service, body, response, logPrefix) => {
        it(`should watch ${service} trade`, async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(response),
            });

            const list = await invityAPI.watchTrade(body as any, service, 0);
            expect(list).toEqual(response);
        });

        it(`should handle get ${service} list when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const list = await invityAPI.watchTrade(body as any, service, 0);
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
                json: () => Promise.resolve(invityAPIFixtures.buyTradeForm),
            });

            const trade = await invityAPI.getBuyTradeForm(invityAPIFixtures.buyTradeFormBody);
            expect(trade).toEqual(invityAPIFixtures.buyTradeForm);
        });

        it(`should handle get buy trade form when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await invityAPI.getBuyTradeForm(invityAPIFixtures.buyTradeFormBody);
            expect(consoleSpy).toHaveBeenCalledWith('[getBuyTradeForm]', error);
            expect(trade).toEqual({ error: 'Error: Error' });
        });
    });

    describe('doSellConfirm', () => {
        it('should do sell confirm', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(invityAPIFixtures.buyTradeForm),
            });

            const trade = await invityAPI.doSellConfirm(invityAPIFixtures.sellTrade);
            expect(trade).toEqual(invityAPIFixtures.buyTradeForm);
        });

        it(`should handle do sell confirm when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await invityAPI.doSellConfirm(invityAPIFixtures.sellTrade);
            expect(consoleSpy).toHaveBeenCalledWith('[doSellConfirm]', error);
            expect(trade).toEqual({ error: 'Error: Error', exchange: 'test-sell' });
        });
    });

    describe('getOTCData', () => {
        it('should do sell confirm', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(invityAPIFixtures.otc),
            });

            const trade = await invityAPI.getOTCData();
            expect(trade).toEqual(invityAPIFixtures.otc);
        });

        it(`should handle do sell confirm when there is error`, async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(error);

            const trade = await invityAPI.getOTCData();
            expect(consoleSpy).toHaveBeenCalledWith('[getOTCData]', error);
            expect(trade).toEqual(undefined);
        });
    });

    it('getCoinLogoUrl', () => {
        const icon = invityAPI.getCoinLogoUrl('bitcoin');

        expect(icon).toEqual('https://exchange.trezor.io/images/coins/suite/bitcoin.svg');
    });

    it('getProviderLogoUrl', () => {
        const icon = invityAPI.getProviderLogoUrl('test.png');

        expect(icon).toEqual('https://exchange.trezor.io/images/exchange/test.png');
    });

    it('getPaymentMethodUrl', () => {
        const icon = invityAPI.getPaymentMethodUrl('creditCard');

        expect(icon).toEqual(
            'https://exchange.trezor.io/images/paymentMethods/suite/creditCard.svg',
        );
    });

    it('setInvityServersEnvironment', () => {
        invityAPI.setInvityServersEnvironment('localhost');

        expect((invityAPI as any).serverEnvironment).toEqual('localhost');
    });

    it('getApiServerUrl', () => {
        const url = invityAPI.getApiServerUrl();

        expect(url).toEqual('https://exchange.trezor.io');
    });
});
