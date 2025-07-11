import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeProviderPicker } from '../ExchangeProviderPicker';

describe('ExchangeProviderPicker', () => {
    let exchangeForm: ExchangeFormType;
    let preloadedState: PreloadedState;

    const renderExchangeForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeProviderPicker = () =>
        renderWithStoreProviderAsync(<ExchangeProviderPicker />, {
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
        const { toJSON } = await renderExchangeProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render skeleton when quotes are being fetched', async () => {
        preloadedState!.wallet!.tradingNew!.exchange!.isLoading = true;

        const { getByText, getByLabelText } = await renderExchangeProviderPicker();

        expect(getByText('Provider')).toBeDefined();
        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeProviderPicker();

        expect(getByText('Provider')).toBeDefined();
        expect(getByText('Mercuryo')).toBeDefined();
    });
});
