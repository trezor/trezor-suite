import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import {
    type LoadTradingCatalogsThunkDeps,
    loadTradingCatalogsThunk,
} from './loadTradingCatalogsThunk';
import { mockTradingQueryClient } from '../../../mocks';
import { TRADING_ANONYMOUS_ID } from '../../constants';
import {
    type TradingRootState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';

jest.mock('../../tradeApi');

const info = {
    coins: {},
    platforms: {},
    config: { btcSwapComposeTemplate: { extraOutputs: [] } },
};

const initServices = () =>
    createTestCompositionRoot<LoadTradingCatalogsThunkDeps, TradingRootState>({
        reducer: {
            wallet: combineReducers({
                trading: prepareTradingReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                }),
            }),
        },
        preloadedState: {
            wallet: { trading: { ...initialState, activeSection: 'buy' } },
        },
        services: () => ({
            getTradingEnvironment: () => 'localhost',
            queryClient: mockTradingQueryClient(),
        }),
    }).services;

describe('loadTradingCatalogsThunk', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(tradeApi.getInfo).mockResolvedValue(info);
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('http://localhost:3330');
    });

    it('loads only the given catalogs and keeps the active section and API key', async () => {
        const services = initServices();
        jest.mocked(tradeApi.getCurrentApiKey).mockReturnValue('buy-account-key');

        await services.store
            .dispatch(loadTradingCatalogsThunk({ catalogs: ['info', 'exchange'] }))
            .unwrap();

        expect(tradeApi.getInfo).toHaveBeenCalledTimes(1);
        expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(1);
        expect(tradeApi.getBuyList).not.toHaveBeenCalled();
        expect(tradeApi.getSellList).not.toHaveBeenCalled();
        expect(services.store.getState().wallet.trading.activeSection).toBe('buy');
        expect(
            services.store.getActions().filter(tradingActions.setTradingActiveSection.match),
        ).toHaveLength(0);
        expect(tradeApi.setApiKey).not.toHaveBeenCalled();
        expect(tradeApi.createAnonymousApiKey).not.toHaveBeenCalled();
    });

    it('creates the anonymous API key when no section has set a key yet', async () => {
        const services = initServices();
        jest.mocked(tradeApi.getCurrentApiKey).mockReturnValue(undefined);

        await services.store.dispatch(loadTradingCatalogsThunk({ catalogs: ['info'] })).unwrap();

        expect(tradeApi.createAnonymousApiKey).toHaveBeenCalledWith(TRADING_ANONYMOUS_ID);
    });

    it('applies the trade server environment before loading', async () => {
        const services = initServices();

        await services.store.dispatch(loadTradingCatalogsThunk({ catalogs: ['info'] })).unwrap();

        expect(tradeApi.setServersEnvironment).toHaveBeenCalledWith('localhost');
    });
});
