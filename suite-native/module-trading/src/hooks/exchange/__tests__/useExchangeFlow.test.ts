import { useEffect } from 'react';

import { ExchangeTrade } from 'invity-api';

import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import quotes from '../../../__fixtures__/quotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeFormValues } from '../../../types/exchange';
import { useExchangeFlow } from '../useExchangeFlow';
import { useExchangeForm } from '../useExchangeForm';

describe('useExchangeFlow', () => {
    const getInitializedStore = async ({ isLoading }: { isLoading?: boolean }) => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingStateWithQuotes() },
        };
        if (isLoading !== undefined) {
            preloadedState.wallet!.tradingNew!.exchange!.isLoading = isLoading;
        }

        return await initStore(preloadedState);
    };

    const renderUseTradingExchangeFlow = ({
        store,
        ...formValues
    }: Partial<ExchangeFormValues> & { store: TestStore }) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useExchangeForm();
                const { setValue } = form;

                useEffect(() => {
                    // Set all provided form values
                    Object.entries(formValues).forEach(([key, value]) => {
                        act(() => {
                            setValue(key as keyof ExchangeFormValues, value);
                        });
                    });
                }, [setValue]);

                return useExchangeFlow(form);
            },
            { store },
        );

    it('should canProceed be false when loading', async () => {
        const store = await getInitializedStore({ isLoading: true });

        const { result } = await renderUseTradingExchangeFlow({ store });
        expect(result.current.canProceed).toBe(false);
    });

    it('should canProceed be true when not loading and orderId filters one in quotes', async () => {
        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseTradingExchangeFlow({
            store,
            quote: quotes[1] as ExchangeTrade,
        });

        expect(result.current.canProceed).toBe(true);
    });
});
