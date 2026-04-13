import { type TradingType } from '@suite-common/trading';
import {
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { selectActiveTradingType, selectEnabledTradingTypes } from '@suite-native/trading-state';

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

    const renderUseActiveTradingTypeReaction = (store: TestStore) =>
        renderHookWithStoreProvider(() => useActiveTradingTypeReaction(), { store });

    beforeEach(() => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy', 'exchange', 'sell']);
        mockUseRouteParams = {};
    });

    it('should set buy active when only buy is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
        const { store } = initStore();

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('buy');
    });

    it('should set exchange active when only exchange is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['exchange']);
        const { store } = initStore();

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('exchange');
    });

    it('should set sell active when only sell is allowed', () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['sell']);
        const { store } = initStore();

        renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('sell');
    });

    it('should render with undefined navigation params', () => {
        (mockUseRouteParams as any) = undefined;
        const { store } = initStore();

        expect(() => renderUseActiveTradingTypeReaction(store)).not.toThrow();
    });

    it('should clear activeTradingType on unmount', () => {
        const { store } = initStore();
        const { unmount } = renderUseActiveTradingTypeReaction(store);

        unmount();

        expect(selectActiveTradingType(store.getState())).toBeUndefined();
    });

    describe('with trading type specified by navigation params', () => {
        it('should set buy active when buy is specified', () => {
            mockUseRouteParams.tradingType = 'buy';
            const { store } = initStore();

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should set exchange active when exchange is specified', () => {
            mockUseRouteParams.tradingType = 'exchange';
            const { store } = initStore();

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('exchange');
        });

        it('should set sell active when sell is specified', () => {
            mockUseRouteParams.tradingType = 'sell';
            const { store } = initStore();

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('sell');
        });

        it('should fallback to buy when navigating to exchange but exchange is disabled', () => {
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            mockUseRouteParams.tradingType = 'exchange';
            const { store } = initStore();

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should fallback to buy when navigating to sell but sell is disabled', () => {
            mockUseRouteParams.tradingType = 'sell';
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            const { store } = initStore();

            renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });
    });
});
