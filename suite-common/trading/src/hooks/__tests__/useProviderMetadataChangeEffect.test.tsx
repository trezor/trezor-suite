import {
    createBuyInfoState,
    createExchangeInfoState,
    createSellInfoState,
    createTradingTestState,
    renderHookWithTradingStore,
} from '../../__tests__/testUtils';
import { getProviderMetadataFixture } from '../../reducers/__fixtures__/providerMetadata';
import { initialState } from '../../reducers/tradingCommonReducer';
import { type TradingType } from '../../types';
import { useProviderMetadataChangeEffect } from '../useProviderMetadataChangeEffect';

const mockProviderMetadataChangeNow = getProviderMetadataFixture();
const mockProviderMetadataSideShift = getProviderMetadataFixture('sideshift');

describe('useProviderMetadataChangeEffect', () => {
    it('should return undefined when no provider metadata is set', () => {
        const { result } = renderHookWithTradingStore(() =>
            useProviderMetadataChangeEffect('buy', undefined, true),
        );

        expect(result.current).toBeUndefined();
    });

    it('should not update provider metadata when areProviderChangesAllowed is false', () => {
        const { result, rerender } = renderHookWithTradingStore<
            ReturnType<typeof useProviderMetadataChangeEffect>,
            { tradingType: TradingType; quoteName?: string; areProviderChangesAllowed?: boolean }
        >(
            ({ tradingType, quoteName, areProviderChangesAllowed }) =>
                useProviderMetadataChangeEffect(tradingType, quoteName, areProviderChangesAllowed),
            {
                preloadedState: createTradingTestState({
                    buy: {
                        ...initialState.buy,
                        buyInfo: createBuyInfoState({ changenow: mockProviderMetadataChangeNow }),
                    },
                }),
                initialProps: {
                    tradingType: 'buy' as TradingType,
                    quoteName: 'changenow',
                    areProviderChangesAllowed: false,
                },
            },
        );

        expect(result.current).toBeUndefined();
        rerender({
            tradingType: 'buy',
            quoteName: 'changenow',
            areProviderChangesAllowed: true,
        });
        expect(result.current).toEqual(mockProviderMetadataChangeNow);
    });

    it('should update provider metadata when provider changes and areProviderChangesAllowed is true (buy)', () => {
        const { result, rerender } = renderHookWithTradingStore<
            ReturnType<typeof useProviderMetadataChangeEffect>,
            { tradingType: TradingType; quoteName?: string; areProviderChangesAllowed?: boolean }
        >(
            ({ tradingType, quoteName, areProviderChangesAllowed }) =>
                useProviderMetadataChangeEffect(tradingType, quoteName, areProviderChangesAllowed),
            {
                preloadedState: createTradingTestState({
                    buy: {
                        ...initialState.buy,
                        buyInfo: createBuyInfoState({
                            changenow: mockProviderMetadataChangeNow,
                            sideshift: mockProviderMetadataSideShift,
                        }),
                    },
                }),
                initialProps: {
                    tradingType: 'buy' as TradingType,
                    quoteName: 'changenow',
                    areProviderChangesAllowed: true,
                },
            },
        );
        expect(result.current).toEqual(mockProviderMetadataChangeNow);
        rerender({
            tradingType: 'buy',
            quoteName: 'sideshift',
            areProviderChangesAllowed: true,
        });

        expect(result.current).toEqual(mockProviderMetadataSideShift);
    });

    it('should update provider metadata for exchange type', () => {
        const { result } = renderHookWithTradingStore(
            () => useProviderMetadataChangeEffect('exchange', 'exchangeProvider', true),
            {
                preloadedState: createTradingTestState({
                    exchange: {
                        ...initialState.exchange,
                        exchangeInfo: createExchangeInfoState({
                            exchangeProvider: mockProviderMetadataChangeNow,
                        }),
                    },
                }),
            },
        );
        expect(result.current).toEqual(mockProviderMetadataChangeNow);
    });

    it('should update provider metadata for sell type', () => {
        const { result } = renderHookWithTradingStore(
            () => useProviderMetadataChangeEffect('sell', 'sellProvider', true),
            {
                preloadedState: createTradingTestState({
                    sell: {
                        ...initialState.sell,
                        sellInfo: createSellInfoState({
                            sellProvider: mockProviderMetadataChangeNow,
                        }),
                    },
                }),
            },
        );
        expect(result.current).toEqual(mockProviderMetadataChangeNow);
    });

    it('should clear provider metadata on unmount', () => {
        const { unmount, store } = renderHookWithTradingStore(
            () => useProviderMetadataChangeEffect('buy', 'changenow', true),
            {
                preloadedState: createTradingTestState({
                    currentProviderMetadata: mockProviderMetadataChangeNow,
                    buy: {
                        ...initialState.buy,
                        buyInfo: createBuyInfoState({
                            changenow: mockProviderMetadataChangeNow,
                        }),
                    },
                }),
            },
        );

        expect(store.getState().wallet.trading.currentProviderMetadata).toEqual(
            mockProviderMetadataChangeNow,
        );
        unmount();
        expect(store.getState().wallet.trading.currentProviderMetadata).toBeUndefined();
    });
});
