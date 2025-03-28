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
        const { queryByText, queryAllByText, getAllByText, getByLabelText } = await renderBuyForm(
            {},
            result.current,
        );

        expect(queryAllByText('Buy').length).toBe(2);
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
        expect(queryByText('Receive account')).toBeDefined();
        expect(queryByText('Payment method')).toBeDefined();
        expect(queryByText('Country of residence')).toBeDefined();
        expect(queryByText('Provider')).toBeDefined();
        expect(queryByText('Continue')).toBeDefined();
        // payment method, country of residence and provider
        expect(getAllByText('Not selected').length).toBe(3);
        // receive account needs coin to be selected
        expect(queryByText('Select coin first')).toBeDefined();
    });

    it('should render with default values', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderFormHook(preloadedState);
        const { queryByText, queryAllByText, getByLabelText } = await renderBuyForm(
            preloadedState,
            result.current,
        );
        expect(queryAllByText('Buy').length).toBe(2);

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);

        expect(queryByText('Receive account')).toBeDefined();
        expect(queryByText('Not selected')).toBeDefined();

        expect(queryByText('Country of residence')).toBeDefined();
        expect(queryByText('🇨🇿 Czech Republic')).toBeDefined();

        expect(queryByText('Provider')).toBeDefined();
        expect(queryByText('Continue')).toBeDefined();
    });

    it('should render only BuyCard and Done when amount input is active', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderFormHook(preloadedState);
        act(() => {
            result.current.setValue('focusedValue', 'fiatValue');
        });
        const { queryByText } = await renderBuyForm(preloadedState, result.current);

        expect(queryByText('Buy')).toBeDefined();
        expect(queryByText('Fund')).toBeDefined();
        expect(queryByText('Receive account')).toBeDefined();

        expect(queryByText('Country of residence')).toBeNull();
        expect(queryByText('Payment method')).toBeNull();
        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
    });
});
