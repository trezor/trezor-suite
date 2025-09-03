import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeRateAndProviderPicker } from '../ExchangeRateAndProviderPicker';

describe('ExchangeRateAndProviderPicker', () => {
    let exchangeForm: ExchangeFormType;
    let preloadedState: PreloadedState;

    const renderExchangeForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeRateAndProviderPicker = () =>
        renderWithStoreProviderAsync(<ExchangeRateAndProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderExchangeForm();
        exchangeForm = result.current;

        preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    });

    it('should render nothing when no quote is selected and quotes are not loading', async () => {
        const { toJSON } = await renderExchangeRateAndProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render provider and rate pickers when no quote is selected and quotes are loading', async () => {
        preloadedState!.wallet!.trading!.exchange!.isLoading = true;

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Rate')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render rate when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Rate')).toBeOnTheScreen();
        expect(getByText('Fixed')).toBeOnTheScreen();
    });
});
