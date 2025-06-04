import { TradingType } from '@suite-common/trading';
import { TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import {
    selectActiveTradingType,
    selectEnabledTradingTypes,
} from '../../../selectors/commonSelectors';
import { useActiveTradingTypeReaction } from '../useActiveTradingTypeReaction';

let mockUseRouteParams: {
    tradingType?: TradingType;
};

jest.mock('../../../selectors/commonSelectors', () => ({
    ...jest.requireActual('../../../selectors/commonSelectors'),
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
        renderHookWithStoreProviderAsync(() => useActiveTradingTypeReaction(), { store });

    beforeEach(() => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy', 'exchange', 'sell']);
        mockUseRouteParams = {};
    });

    it('should set buy active when only buy is allowed', async () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
        const store = await initStore();

        await renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('buy');
    });

    it('should set exchange active when only exchange is allowed', async () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['exchange']);
        const store = await initStore();

        await renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('exchange');
    });

    it('should set sell active when only sell is allowed', async () => {
        castedSelectEnabledTradingTypes.mockReturnValue(['sell']);
        const store = await initStore();

        await renderUseActiveTradingTypeReaction(store);

        expect(selectActiveTradingType(store.getState())).toBe('sell');
    });

    it('should render with undefined navigation params', async () => {
        (mockUseRouteParams as any) = undefined;
        const store = await initStore();

        expect(() => renderUseActiveTradingTypeReaction(store)).not.toThrow();
    });

    it('should clear activeTradingType on unmount', async () => {
        const store = await initStore();
        const { unmount } = await renderUseActiveTradingTypeReaction(store);

        unmount();

        expect(selectActiveTradingType(store.getState())).toBeUndefined();
    });

    describe('with trading type specified by navigation params', () => {
        it('should set buy active when buy is specified', async () => {
            mockUseRouteParams.tradingType = 'buy';
            const store = await initStore();

            await renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should set exchange active when exchange is specified', async () => {
            mockUseRouteParams.tradingType = 'exchange';
            const store = await initStore();

            await renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('exchange');
        });

        it('should set sell active when sell is specified', async () => {
            mockUseRouteParams.tradingType = 'sell';
            const store = await initStore();

            await renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('sell');
        });

        it('should fallback to buy when navigating to exchange but exchange is disabled', async () => {
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            mockUseRouteParams.tradingType = 'exchange';
            const store = await initStore();

            await renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });

        it('should fallback to buy when navigating to sell but sell is disabled', async () => {
            mockUseRouteParams.tradingType = 'sell';
            castedSelectEnabledTradingTypes.mockReturnValue(['buy']);
            const store = await initStore();

            await renderUseActiveTradingTypeReaction(store);

            expect(selectActiveTradingType(store.getState())).toBe('buy');
        });
    });
});
