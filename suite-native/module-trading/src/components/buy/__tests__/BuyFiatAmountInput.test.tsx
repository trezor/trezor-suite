import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFiatAmountInput } from '../BuyFiatAmountInput';

describe('BuyFiatAmountInput', () => {
    const renderFiatAmountInput = (form: BuyFormType, preloadedState: PreloadedState = {}) =>
        renderWithStoreProvider(
            <Form form={form}>
                <BuyFiatAmountInput />
            </Form>,
            { preloadedState },
        );

    const renderUseTradingBuyForm = (preloadedState: PreloadedState = {}) => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), '100');

        expect(form.getValues('fiatValue')).toEqual('100');
    });

    it('should format input value to be decimal', async () => {
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('fiatValue')).toEqual('1.123');
        expect(getByLabelText('You pay')).toHaveDisplayValue('1.123');
    });

    it('should always escape non-numeric characters', async () => {
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), 'asd');

        expect(form.getValues('fiatValue')).toBeUndefined();
        expect(getByLabelText('You pay')).toHaveDisplayValue('');
    });

    it('should display loading skeleton while amountInCrypto is true and buyInfo is loading', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.buy.isLoading = true;
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('amountInCrypto', true);
        });

        const { getByLabelText } = renderFiatAmountInput(form, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });

    it('should not display loading skeleton while amountInCrypto is false and buyInfo is loading', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.buy.isLoading = true;
        const form = renderUseTradingBuyForm();

        const { queryByLabelText } = renderFiatAmountInput(form, preloadedState);

        expect(queryByLabelText('Fetching offers...')).toBeNull();
    });

    it('should limit value to 3 decimals', async () => {
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderFiatAmountInput(form);

        await userEvent.type(getByLabelText('You pay'), '1.0123456789');

        expect(form.getValues('fiatValue')).toEqual('1.012');
    });
});
