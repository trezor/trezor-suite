import { selectTradingProviderMetadata } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';
import { type TestStore } from '@suite-native/test-utils-store';
import { buyMercuryo } from '@suite-native/trading-fixtures';

import { useProviderMetadataChangeEffect } from './useProviderMetadataChangeEffect';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

type ProviderFormValues = {
    quote: {
        exchange: string | undefined;
    };
};

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

    const renderUseProviderMetadataChangeEffect = (exchange: string | undefined) =>
        renderHookWithTradingProvider(
            () => {
                const form = useForm<ProviderFormValues>({
                    defaultValues: { quote: { exchange } },
                    validation: yup.object({}),
                });

                return useProviderMetadataChangeEffect(form.control, 'buy');
            },
            { store, tradeType: 'buy' },
        );

    beforeEach(() => {
        store = createTradingLightStore({ tradeType: 'buy' });
        mockIsFocused = true;
    });

    it('should set currentProviderMetadata when quote is set', () => {
        const { result } = renderUseProviderMetadataChangeEffect('mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toEqual(buyMercuryo);
        expect(result.current).toEqual(buyMercuryo);
    });

    it('should clear currentProviderMetadata on unmount', () => {
        const { unmount } = renderUseProviderMetadataChangeEffect('mercuryo');

        unmount();

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });

    it('should not change provider metadata when screen is not focused', () => {
        mockIsFocused = false;
        renderUseProviderMetadataChangeEffect('mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });
});
