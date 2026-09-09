import { type Store } from '@reduxjs/toolkit';

import { selectTradingProviderMetadata } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';
import { buyMercuryo } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useProviderMetadataChangeEffect } from './useProviderMetadataChangeEffect';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

type State = TradingRootState;

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
    let store: Store<State>;

    const renderUseProviderMetadataChangeEffect = async (exchange: string | undefined) =>
        await renderHookWithTradingProvider(
            () => {
                const form = useForm<ProviderFormValues>({
                    defaultValues: { quote: { exchange } },
                    validation: yup.object({}),
                });

                return useProviderMetadataChangeEffect(form.control, 'buy');
            },
            { services: { store }, tradeType: 'buy' },
        );

    beforeEach(() => {
        store = createTradingTestStore({ tradeType: 'buy' });
        mockIsFocused = true;
    });

    it('should set currentProviderMetadata when quote is set', async () => {
        const { result } = await renderUseProviderMetadataChangeEffect('mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toEqual(buyMercuryo);
        expect(result.current).toEqual(buyMercuryo);
    });

    it('should clear currentProviderMetadata on unmount', async () => {
        const { unmount } = await renderUseProviderMetadataChangeEffect('mercuryo');

        await unmount();

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });

    it('should not change provider metadata when screen is not focused', async () => {
        mockIsFocused = false;
        await renderUseProviderMetadataChangeEffect('mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });
});
