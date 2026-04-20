import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type TradingType } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    selectActiveTradingType,
    selectEnabledTradingTypes,
    tradingSlice,
} from '@suite-native/trading-state';

import { useActiveTradingTypeReaction } from '../useActiveTradingTypeReaction';

let mockUseRouteParams: {
    tradingType?: TradingType;
};

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectEnabledTradingTypes: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
        params: mockUseRouteParams,
    }),
}));

describe('useActiveTradingTypeReaction', () => {
    const castedSelectEnabledTradingTypes = selectEnabledTradingTypes as unknown as jest.Mock;
    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderUseActiveTradingTypeReaction = (store: TestStore) =>
        renderHookWithStoreProvider(() => useActiveTradingTypeReaction(), { store });

    beforeEach(() => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy', 'exchange', 'sell']);
        mockUseRouteParams = {};
    });

    it('should set buy active when only buy is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
        const store = createLightStore({ reducer });

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('buy');
    });

    it('should set exchange active when only exchange is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['exchange']);
        const store = createLightStore({ reducer });

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('exchange');
    });

    it('should set sell active when only sell is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['sell']);
        const store = createLightStore({ reducer });

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('sell');
    });

    it('should render with undefined navigation params', () => {
        (mockUseRouteParams as any) = undefined;
        const store = createLightStore({ reducer });

        expect(() => renderUseActiveTradingTypeReaction(store)).not.toThrow();
    });

    it('should clear activeTradingType on unmount', () => {
        const store = createLightStore({ reducer });
        const { unmount } = renderUseActiveTradingTypeReaction(store);

        unmount();

        expect(selectActiveTradingType(store.getState())).toBeUndefined();
    });

    describe('with trading type specified by navigation params', () => {
        it('should set buy active when buy is specified', () => {
            mockUseRouteParams.tradingType = 'buy';
            const store = createLightStore({ reducer });

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should set exchange active when exchange is specified', () => {
            mockUseRouteParams.tradingType = 'exchange';
            const store = createLightStore({ reducer });

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('exchange');
        });

        it('should set sell active when sell is specified', () => {
            mockUseRouteParams.tradingType = 'sell';
            const store = createLightStore({ reducer });

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('sell');
        });

        it('should fallback to buy when navigating to exchange but exchange is disabled', () => {
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            mockUseRouteParams.tradingType = 'exchange';
            const store = createLightStore({ reducer });

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should fallback to buy when navigating to sell but sell is disabled', () => {
            mockUseRouteParams.tradingType = 'sell';
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            const store = createLightStore({ reducer });

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });
    });
});
