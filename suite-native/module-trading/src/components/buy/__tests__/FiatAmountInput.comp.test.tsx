import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { FiatAmountInput } from '../FiatAmountInput';

describe('FiatAmountInput', () => {
    const renderFiatAmountInput = (form: TradingBuyForm, preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <FiatAmountInput />
            </Form>,
            { preloadedState },
        );

    const renderUseTradingBuyForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = await renderUseTradingBuyForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), '100');

        expect(form.getValues('fiatValue')).toEqual('100');
    });

    it('should format input value to be decimal', async () => {
        const form = await renderUseTradingBuyForm();
        const { getByLabelText } = await renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('fiatValue')).toEqual('1.123');
    });

    it('should display loading skeleton while amountInCrypto is true and buyInfo is loading', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        preloadedState.wallet.tradingNew.buy.isLoading = true;
        const form = await renderUseTradingBuyForm();
        act(() => {
            form.setValue('amountInCrypto', true);
        });

        const { getByLabelText } = await renderFiatAmountInput(form, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });

    it('should not display loading skeleton while amountInCrypto is false and buyInfo is loading', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        preloadedState.wallet.tradingNew.buy.isLoading = true;
        const form = await renderUseTradingBuyForm();

        const { queryByLabelText } = await renderFiatAmountInput(form, preloadedState);

        expect(queryByLabelText('Fetching offers...')).toBeNull();
    });
});
