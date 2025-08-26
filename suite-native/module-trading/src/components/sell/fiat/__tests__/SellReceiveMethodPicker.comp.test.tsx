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
import { SellReceiveMethodPicker } from '../SellReceiveMethodPicker';

describe('SellReceiveMethodPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellReceiveMethodPicker = () =>
        renderWithStoreProviderAsync(<SellReceiveMethodPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = await renderSellForm();
        form = result.current;
    });

    it('should render nothing when no quotes are loaded', async () => {
        const { toJSON } = await renderSellReceiveMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        preloadedState!.wallet!.tradingNew!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render selected payment method', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;
        act(() => {
            form.setValue('quote', sellQuotes[1]);
        });

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('Selected receive method')).toHaveTextContent('Bank Transfer');
    });

    it('should render "Not selected" when no quote is selected', async () => {
        preloadedState!.wallet!.tradingNew!.sell!.quotes = sellQuotes;

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('No receive method selected')).toHaveTextContent('Not selected');
    });
});
