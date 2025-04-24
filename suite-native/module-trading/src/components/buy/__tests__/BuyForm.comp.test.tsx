import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyForm } from '../BuyForm';

describe('BuyForm', () => {
    const renderFormHook = (preloadedState: PreloadedState) =>
        renderHookWithStoreProviderAsync(() => useTradingBuyForm(), { preloadedState });

    const renderBuyForm = (preloadedState: PreloadedState, form: TradingBuyForm) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyForm />
            </Form>,
            { preloadedState },
        );

    it('should render when buy data are not preloaded', async () => {
        const { result } = await renderFormHook({});
        const { queryByText, queryAllByText, getByLabelText } = await renderBuyForm(
            {},
            result.current,
        );

        expect(queryAllByText('Buy').length).toBe(2);
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
        expect(queryByText('Receive account')).toBeTruthy();
        expect(queryByText('Payment method')).toBeNull();
        expect(queryByText('Country of residence')).toBeTruthy();
        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
        // country
        expect(queryByText('Not selected')).toBeTruthy();
        // receive account needs coin to be selected
        expect(queryByText('Select coin first')).toBeTruthy();
    });

    it('should render with default values', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderFormHook(preloadedState);
        const { queryByText, queryAllByText, getByLabelText, getByText } = await renderBuyForm(
            preloadedState,
            result.current,
        );

        expect(queryAllByText('Buy').length).toBe(2);

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);

        expect(getByText('Receive account')).toBeTruthy();
        expect(getByText('Select coin first')).toBeTruthy();

        expect(getByText('Country of residence')).toBeTruthy();
        expect(getByText('🇨🇿 Czech Republic')).toBeTruthy();

        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
    });

    it('should render only BuyCard and Done when amount input is active', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderFormHook(preloadedState);
        act(() => {
            result.current.setValue('focusedValue', 'fiatValue');
        });
        const { queryByText } = await renderBuyForm(preloadedState, result.current);

        expect(queryByText('Buy')).toBeTruthy();
        expect(queryByText('Fund')).toBeTruthy();
        expect(queryByText('Receive account')).toBeTruthy();

        expect(queryByText('Country of residence')).toBeNull();
        expect(queryByText('Payment method')).toBeNull();
        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
    });
});
