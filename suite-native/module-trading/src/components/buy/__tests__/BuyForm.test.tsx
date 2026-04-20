import { Form } from '@suite-native/forms';
import { act, screen } from '@suite-native/test-utils-store';
import { btcAsset, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyForm } from '../BuyForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('BuyForm', () => {
    const residenceCheckDisabledOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
        wallet: {
            trading: {
                buy: {
                    buyInfo: undefined,
                },
                residence: {
                    country: undefined,
                },
            },
        },
    };

    const renderFormHook = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderHookWithTradingProvider(() => useBuyForm(), { overrides });

    const renderBuyForm = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
        form: BuyFormType,
    ) =>
        renderWithTradingProvider(<BuyForm />, {
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    afterEach(() => {
        screen.unmount();
    });

    it('should render when buy data are not preloaded', () => {
        const { result } = renderFormHook(residenceCheckDisabledOverrides);
        const { queryByText, getByText, getByLabelText } = renderBuyForm(
            residenceCheckDisabledOverrides,
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
        const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: getInitializedTradingState() },
            featureFlags: createTradingFeatureFlags(),
        };

        beforeEach(() => {
            const { result } = renderFormHook(overrides);
            form = result.current;
        });

        it('should render with default values', () => {
            const { queryByText, getByLabelText, getByText } = renderBuyForm(overrides, form);

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
            const { queryByText, getByText } = renderBuyForm(overrides, form);

            expect(getByText('You pay')).toBeTruthy();
            expect(getByText('You get')).toBeTruthy();

            expect(queryByText('Country of residence')).toBeNull();
            expect(queryByText('Payment method')).toBeNull();
            expect(queryByText('Provider')).toBeNull();
            expect(queryByText('Continue')).toBeNull();
        });

        it('should not render receive account when assets is not selected', () => {
            const { queryByText, getByTestId } = renderBuyForm(overrides, form);

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
            const { getByText, getByTestId } = renderBuyForm(overrides, form);

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
