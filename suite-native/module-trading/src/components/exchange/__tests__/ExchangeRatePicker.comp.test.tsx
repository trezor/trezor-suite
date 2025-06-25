import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeRatePicker } from '../ExchangeRatePicker';

describe('ExchangeRatePicker', () => {
    let exchangeForm: ExchangeFormType;
    let preloadedState: PreloadedState;

    const renderExchangeForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeRatePicker = () =>
        renderWithStoreProviderAsync(<ExchangeRatePicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderExchangeForm();
        exchangeForm = result.current;

        preloadedState = {
            wallet: { tradingNew: getInitializedTradingState() },
        };
    });

    it('should render nothing when no quote is selected', async () => {
        const { toJSON } = await renderExchangeRatePicker();

        expect(toJSON()).toBeNull();
    });

    it('should render skeleton when quotes are being fetched', async () => {
        preloadedState!.wallet!.tradingNew!.exchange!.isLoading = true;

        const { getByText, getByLabelText } = await renderExchangeRatePicker();

        expect(getByText('Rate')).toBeDefined();
        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render rate when quote is selected', async () => {
        exchangeForm.setValue('quote', exchangeQuotes[0]);

        const { getByText } = await renderExchangeRatePicker();

        expect(getByText('Rate')).toBeDefined();
        expect(getByText('Fixed')).toBeDefined();
    });
});
