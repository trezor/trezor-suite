import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils';
import {
    btcAsset,
    getInitializedTradingState,
    residenceCheckDisabledState,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyForm } from '../BuyForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('BuyForm', () => {
    const renderFormHook = (preloadedState: PreloadedState) =>
        renderHookWithStoreProvider(() => useBuyForm(), { preloadedState });

    const renderBuyForm = (preloadedState: PreloadedState, form: BuyFormType) =>
        renderWithStoreProvider(<BuyForm />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    afterEach(() => {
        screen.unmount();
    });

    it('should render when buy data are not preloaded', () => {
        const { result } = renderFormHook(residenceCheckDisabledState);
        const { queryByText, getByText, getByLabelText } = renderBuyForm(
            residenceCheckDisabledState,
            result.current,
        );

        expect(getByText('You pay')).toBeTruthy();
        expect(getByLabelText('Select asset')).toHaveTextContent(/Select asset/);
        expect(queryByText('Receive account')).toBeNull();
        expect(queryByText('Payment method')).toBeNull();
        expect(queryByText('Country of residence')).toBeTruthy();
        expect(queryByText('Provider')).toBeNull();
        expect(queryByText('Continue')).toBeNull();
        // country
        expect(getByText('Not selected')).toBeTruthy();
    });

    describe('with preloaded buy data', () => {
        let form: BuyFormType;
        const preloadedState = {
            wallet: { trading: getInitializedTradingState() },
            ...residenceCheckDisabledState,
        };

        beforeEach(() => {
            const { result } = renderFormHook(preloadedState);
            form = result.current;
        });

        it('should render with default values', () => {
            const { queryByText, getByLabelText, getByText } = renderBuyForm(preloadedState, form);

            expect(getByText('You pay')).toBeTruthy();

            expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
            expect(getByLabelText('Select asset')).toHaveTextContent(/Select asset/);

            expect(queryByText('Receive account')).toBeNull();

            expect(getByText('Country of residence')).toBeTruthy();
            expect(getByText('🇨🇿 CZE')).toBeTruthy();

            expect(queryByText('Provider')).toBeNull();
            expect(queryByText('Continue')).toBeNull();
        });

        it('should render only BuyCard and Done when amount input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'fiatValue');
            });
            const { queryByText, getByText } = renderBuyForm(preloadedState, form);

            expect(getByText('You pay')).toBeTruthy();
            expect(getByText('You get')).toBeTruthy();

            expect(queryByText('Country of residence')).toBeNull();
            expect(queryByText('Payment method')).toBeNull();
            expect(queryByText('Provider')).toBeNull();
            expect(queryByText('Continue')).toBeNull();
        });

        it('should not render receive account when assets is not selected', () => {
            const { queryByText, getByTestId } = renderBuyForm(preloadedState, form);

            expect(queryByText('Receive account')).toBeNull();
            expect(getByTestId('@trading/buyCard/fiatSection')).toHaveStyle({
                borderBottomWidth: 1,
            });
            expect(getByTestId('@trading/buyCard/cryptoSection')).toHaveStyle({
                borderBottomWidth: 0,
            });
        });

        it('should render receive account once asset is selected', () => {
            act(() => {
                form.setValue('asset', btcAsset);
            });
            const { getByText, getByTestId } = renderBuyForm(preloadedState, form);

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
