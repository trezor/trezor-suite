import { combineReducers } from '@reduxjs/toolkit';

import { type QueryClientDep, tradingQueryKeys } from '@suite-common/react-query';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useTradingCatalogStatus } from './useTradingCatalogStatus';
import { mockTradingQueryClient } from '../../mocks';
import { type TradingRootState, initialState } from '../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../reducers/tradingReducer';
import { type TradingCatalog, loadTradingCatalog } from '../thunks/common/tradingCatalogs';
import { tradeApi } from '../tradeApi';

jest.mock('../tradeApi');

const SERVER_URL = 'http://localhost:3330';
const OTHER_SERVER_URL = 'https://staging-exchange.trezor.io';
const LOADED_AT = 1_000_000;
const info = {
    coins: {},
    platforms: {},
    config: { btcSwapComposeTemplate: { extraOutputs: [] } },
};
const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const initServices = () =>
    createTestCompositionRoot<WithServices<QueryClientDep>, TradingRootState>({
        reducer: {
            wallet: combineReducers({ trading: tradingReducer }),
        },
        preloadedState: {
            wallet: { trading: initialState },
        },
        services: () => ({ queryClient: mockTradingQueryClient() }),
    }).services;

type TestServices = ReturnType<typeof initServices>;

const loadCatalog = (services: TestServices, catalog: TradingCatalog) =>
    loadTradingCatalog(catalog, {
        dispatch: services.store.dispatch,
        queryClient: services.queryClient,
        forceReload: false,
    });

const renderCatalogStatus = (services: TestServices, catalogs?: readonly TradingCatalog[]) =>
    renderHookWithStoreProvider(() => useTradingCatalogStatus(catalogs), { services });

describe('useTradingCatalogStatus', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(Date, 'now').mockReturnValue(LOADED_AT);
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue(SERVER_URL);
        jest.mocked(tradeApi.getInfo).mockResolvedValue(info);
        jest.mocked(tradeApi.getExchangeList).mockResolvedValue([]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('is loading while a catalog fetch is in flight', async () => {
        const services = initServices();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const { result } = renderCatalogStatus(services);
        let infoLoad = Promise.resolve();

        act(() => {
            infoLoad = loadCatalog(services, 'info');
        });

        expect(result.current).toEqual({ isLoading: true, lastLoadedTimestamp: 0 });

        await act(async () => {
            pendingInfo.resolve(info);
            await infoLoad;
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('stays at a zero timestamp while a requested catalog has not loaded', async () => {
        const services = initServices();
        const infoStatus = renderCatalogStatus(services, ['info']);
        const infoAndExchangeStatus = renderCatalogStatus(services, ['info', 'exchange']);

        await act(() => loadCatalog(services, 'info'));

        expect(infoStatus.result.current).toEqual({
            isLoading: false,
            lastLoadedTimestamp: LOADED_AT,
        });
        expect(infoAndExchangeStatus.result.current).toEqual({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
    });

    it('reports the oldest load once every requested catalog has loaded', async () => {
        const services = initServices();
        const { result } = renderCatalogStatus(services, ['info', 'exchange']);

        await act(() => loadCatalog(services, 'info'));
        jest.spyOn(Date, 'now').mockReturnValue(LOADED_AT + 1);
        await act(() => loadCatalog(services, 'exchange'));

        expect(result.current).toEqual({ isLoading: false, lastLoadedTimestamp: LOADED_AT });
    });

    it('is loading by default while only the swap catalog fetches', async () => {
        const services = initServices();
        await Promise.all(
            (['info', 'buy', 'sell'] as const).map(catalog => loadCatalog(services, catalog)),
        );
        const pendingExchangeList = createDeferred<[]>();
        jest.mocked(tradeApi.getExchangeList).mockReturnValueOnce(pendingExchangeList.promise);
        const { result } = renderCatalogStatus(services);
        let exchangeLoad = Promise.resolve();

        act(() => {
            exchangeLoad = loadCatalog(services, 'exchange');
        });

        expect(result.current).toEqual({ isLoading: true, lastLoadedTimestamp: 0 });

        await act(async () => {
            pendingExchangeList.resolve([]);
            await exchangeLoad;
        });

        expect(result.current).toEqual({ isLoading: false, lastLoadedTimestamp: LOADED_AT });
    });

    it('re-renders when the cache alone changes', () => {
        const services = initServices();
        const { result } = renderCatalogStatus(services, ['info']);

        act(() => {
            services.queryClient.setQueryData(tradingQueryKeys.catalog(SERVER_URL, 'info'), info);
        });

        expect(result.current).toEqual({ isLoading: false, lastLoadedTimestamp: LOADED_AT });
    });

    it('follows the catalogs of the server in use after a debug switch', async () => {
        const services = initServices();
        const { result } = renderCatalogStatus(services, ['info']);
        await act(() => loadCatalog(services, 'info'));
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue(OTHER_SERVER_URL);
        jest.spyOn(Date, 'now').mockReturnValue(LOADED_AT + 1);
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        let infoLoad = Promise.resolve();

        act(() => {
            infoLoad = loadCatalog(services, 'info');
        });

        expect(result.current).toEqual({ isLoading: true, lastLoadedTimestamp: 0 });

        await act(async () => {
            pendingInfo.resolve(info);
            await infoLoad;
        });

        expect(result.current).toEqual({ isLoading: false, lastLoadedTimestamp: LOADED_AT + 1 });
    });
});
