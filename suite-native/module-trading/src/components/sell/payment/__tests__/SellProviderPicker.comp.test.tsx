import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { sellQuotes } from '../../../../__fixtures__/sellQuotes';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../../types/sell';
import { SellProviderPicker } from '../SellProviderPicker';

describe('SellProviderPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellProviderPicker = () =>
        renderWithStoreProviderAsync(<SellProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = await renderSellForm();
        form = result.current;
    });

    it('should render nothing when no quotes are loaded', async () => {
        const { toJSON } = await renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellProviderPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellProviderPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render selected payment provider', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        act(() => {
            form.setValue('quote', sellQuotes[1]);
        });

        const { getByLabelText } = await renderSellProviderPicker();

        expect(getByLabelText('Selected provider')).toHaveTextContent('Banxa');
    });

    it('should display kyc warning when not loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        act(() => {
            form.setValue('quote', sellQuotes[1]);
        });

        const { getByText } = await renderSellProviderPicker();

        expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
    });

    it('should not display kyc warning when loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;
        act(() => {
            form.setValue('quote', sellQuotes[1]);
        });

        const { queryByText } = await renderSellProviderPicker();

        expect(queryByText('This provider requires to know your identity.')).not.toBeOnTheScreen();
    });
});
