import { selectTradingProviderMetadata } from '@suite-common/trading';
import { type TestStore } from '@suite-native/test-utils-store';
import { buyMercuryo } from '@suite-native/trading-fixtures';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import {
    type QuoteProviderFormWatch,
    useProviderMetadataChangeEffect,
} from '../useProviderMetadataChangeEffect';

let mockIsFocused = true;

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');

    return {
        ...actualNav,
        useIsFocused: () => mockIsFocused,
    };
});

describe('useProviderMetadataChangeEffect', () => {
    let store: TestStore;

    const renderUseProviderMetadataChangeEffect = (watch: QuoteProviderFormWatch) =>
        renderHookWithTradingProvider(() => useProviderMetadataChangeEffect(watch, 'buy'), {
            store,
            tradeType: 'buy',
            providers: [],
        });

    beforeEach(() => {
        store = createTradingLightStore({ tradeType: 'buy' });
        mockIsFocused = true;
    });

    it('should set currentProviderMetadata when quote is set', () => {
        const { result } = renderUseProviderMetadataChangeEffect(_ => 'mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toEqual(buyMercuryo);
        expect(result.current).toEqual(buyMercuryo);
    });

    it('should clear currentProviderMetadata on unmount', () => {
        const { unmount } = renderUseProviderMetadataChangeEffect(_ => 'mercuryo');

        unmount();

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });

    it('should not change provider metadata when screen is not focused', () => {
        mockIsFocused = false;
        renderUseProviderMetadataChangeEffect(_ => 'mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });
});
