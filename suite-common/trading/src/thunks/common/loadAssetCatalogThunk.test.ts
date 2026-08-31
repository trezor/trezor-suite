import {
    type CryptoId,
    type ExchangeListResponse,
    type ExchangeProviderInfo,
    type InfoResponse,
} from 'invity-api';

import { createMockDispatch } from '@suite-common/redux-utils/mocks';

import { type LoadAssetCatalogThunkState, loadAssetCatalogThunk } from './loadAssetCatalogThunk';
import { exchange } from '../../reducers/__fixtures__/exchangeTradingReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { tradeApi } from '../../tradeApi';

jest.mock('../../tradeApi');

const info: InfoResponse = {
    coins: {
        bitcoin: {
            coingeckoId: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'BTC',
            services: { buy: true, sell: true, exchange: true },
        },
    },
    platforms: {},
    config: {},
};

const bitcoinCryptoId = 'bitcoin' as CryptoId;

const exchangeWithAssets: ExchangeProviderInfo = {
    ...exchange,
    buyTickers: [bitcoinCryptoId],
    sellTickers: [bitcoinCryptoId],
};

const createState = (tradingState: Partial<TradingState> = {}): LoadAssetCatalogThunkState => ({
    wallet: {
        trading: {
            ...initialState,
            ...tradingState,
        },
    },
});

const runThunk = async (state = createState()) => {
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({
        getState,
        extra: { services: { getTradingEnvironment: () => 'staging' as const } },
    });
    const result = await dispatch(loadAssetCatalogThunk()).unwrap();

    return { actions, result };
};

describe(loadAssetCatalogThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads only the asset catalog with one anonymous request identity', async () => {
        tradeApi.getInfo = jest.fn().mockResolvedValue(info);
        tradeApi.getExchangeList = jest
            .fn()
            .mockResolvedValue([exchangeWithAssets] satisfies ExchangeListResponse);
        tradeApi.getCurrentAccountDescriptor = jest.fn().mockReturnValue('sensitive-descriptor');

        const { actions, result } = await runThunk();

        expect(result).toEqual({ success: true });
        expect(tradeApi.setServersEnvironment).toHaveBeenCalledWith('staging');
        expect(tradeApi.getInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                identity: {
                    apiKey: expect.stringMatching(/^[a-f0-9]{64}$/),
                    traceId: expect.stringMatching(/^[a-f0-9]{64}$/),
                },
                signal: expect.any(AbortSignal),
            }),
        );
        expect(tradeApi.getExchangeList).toHaveBeenCalledWith(
            expect.objectContaining({
                identity: {
                    apiKey: expect.stringMatching(/^[a-f0-9]{64}$/),
                    traceId: expect.stringMatching(/^[a-f0-9]{64}$/),
                },
                signal: expect.any(AbortSignal),
            }),
        );
        expect(jest.mocked(tradeApi.getInfo).mock.calls[0]?.[0]?.identity).toBe(
            jest.mocked(tradeApi.getExchangeList).mock.calls[0]?.[0]?.identity,
        );
        expect(tradeApi.getCurrentAccountDescriptor).not.toHaveBeenCalled();
        expect(actions).toEqual([
            expect.objectContaining({ type: loadAssetCatalogThunk.pending.type }),
            tradingActions.saveInfo(info),
            tradingExchangeActions.saveExchangeInfo({
                providerInfos: { [exchange.name]: exchangeWithAssets },
                buyCryptoIds: exchangeWithAssets.buyTickers,
                sellCryptoIds: exchangeWithAssets.sellTickers,
            }),
            expect.objectContaining({ type: loadAssetCatalogThunk.fulfilled.type }),
        ]);
    });

    it('uses an already loaded catalog without making a request', async () => {
        tradeApi.getInfo = jest.fn();
        tradeApi.getExchangeList = jest.fn();
        const state = createState({
            info: { coins: info.coins, platforms: info.platforms },
            exchange: {
                ...initialState.exchange,
                exchangeInfo: {
                    providerInfos: { [exchange.name]: exchangeWithAssets },
                    buyCryptoIds: [...exchangeWithAssets.buyTickers],
                    sellCryptoIds: [...exchangeWithAssets.sellTickers],
                },
            },
        });

        const { result } = await runThunk(state);

        expect(result).toEqual({ success: true });
        expect(tradeApi.getInfo).not.toHaveBeenCalled();
        expect(tradeApi.getExchangeList).not.toHaveBeenCalled();
    });

    it('reports an unavailable catalog without saving empty data', async () => {
        tradeApi.getInfo = jest.fn().mockResolvedValue({ coins: {}, platforms: {}, config: {} });
        tradeApi.getExchangeList = jest.fn().mockResolvedValue([]);
        const state = createState();
        const getState = () => state;
        const { actions, dispatch } = createMockDispatch({
            getState,
            extra: { services: { getTradingEnvironment: () => 'staging' as const } },
        });

        await expect(dispatch(loadAssetCatalogThunk()).unwrap()).rejects.toEqual({
            error: 'catalog-unavailable',
        });
        expect(actions).toEqual([
            expect.objectContaining({ type: loadAssetCatalogThunk.pending.type }),
            expect.objectContaining({ type: loadAssetCatalogThunk.rejected.type }),
        ]);
    });
});
