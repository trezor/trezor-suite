import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyForm } from '../BuyForm';

describe('BuyForm', () => {
    const renderFormHook = (preloadedState: PreloadedState) =>
        renderHookWithStoreProviderAsync(() => useBuyForm(), { preloadedState });

    const renderBuyForm = (preloadedState: PreloadedState, form: TradingBuyForm) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyForm />
            </Form>,
            { preloadedState },
        );

    it('should render when buy data are not preloaded', async () => {
        const { result } = await renderFormHook({});
        const { queryByText, getByText, getByLabelText } = await renderBuyForm({}, result.current);

        expect(getByText('You pay')).toBeTruthy();
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
        expect(queryByText('Receive account')).toBeNull();
        expect(queryByText('Payment method')).toBeNull();
        expect(queryByText('Country of residence')).toBeTruthy();
        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
        // country
        expect(getByText('Not selected')).toBeTruthy();
    });

    describe('with preloaded buy data', () => {
        let form: TradingBuyForm;
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };

        beforeEach(async () => {
            const { result } = await renderFormHook(preloadedState);
            form = result.current;
        });

        it('should render with default values', async () => {
            const { queryByText, getByLabelText, getByText } = await renderBuyForm(
                preloadedState,
                form,
            );

            expect(getByText('You pay')).toBeTruthy();

            expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
            expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);

            expect(queryByText('Receive account')).toBeNull();

            expect(getByText('Country of residence')).toBeTruthy();
            expect(getByText('🇨🇿 Czech Republic')).toBeTruthy();

            expect(queryByText('Provider')).toBeNull();
            expect(queryByText('Continue')).toBeNull();
        });

        it('should render only BuyCard and Done when amount input is active', async () => {
            act(() => {
                form.setValue('focusedValue', 'fiatValue');
            });
            const { queryByText, getByText } = await renderBuyForm(preloadedState, form);

            expect(getByText('You pay')).toBeTruthy();
            expect(getByText('You get')).toBeTruthy();

            expect(queryByText('Country of residence')).toBeNull();
            expect(queryByText('Payment method')).toBeNull();
            expect(queryByText('Provider')).toBeNull();
            expect(queryByText('Continue')).toBeNull();
        });

        it('should not render receive account when assets is not selected', async () => {
            const { queryByText, getByTestId } = await renderBuyForm(preloadedState, form);

            expect(queryByText('Receive account')).toBeNull();
            expect(getByTestId('@trading/buyCard/fiatSection')).toHaveStyle({
                borderBottomWidth: 1,
            });
            expect(getByTestId('@trading/buyCard/cryptoSection')).toHaveStyle({
                borderBottomWidth: 0,
            });
        });

        it('should render receive account once asset is selected', async () => {
            act(() => {
                form.setValue('asset', btcAsset);
            });
            const { getByText, getByTestId } = await renderBuyForm(preloadedState, form);

            expect(getByText('Receive account')).toBeTruthy();
            expect(getByTestId('@trading/buyCard/fiatSection')).toHaveStyle({
                borderBottomWidth: 1,
            });
            expect(getByTestId('@trading/buyCard/cryptoSection')).toHaveStyle({
                borderBottomWidth: 1,
            });
        });
    });
});
