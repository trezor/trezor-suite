import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { act, fireEvent } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeReceiveAmountInput,
    type ExchangeReceiveAmountInputProps,
} from '../ExchangeReceiveAmountInput';

describe('ExchangeReceiveAmountInput', () => {
    let form: ExchangeFormType;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    };

    const renderExchangeReceiveAmountInput = (
        props: Partial<ExchangeReceiveAmountInputProps> = {},
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <ExchangeReceiveAmountInput showAssetsSheet={jest.fn()} {...props} />,
            {
                tradeType: 'exchange',
                overrides: { ...baseOverrides, ...extraOverrides },
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            },
        );

    beforeEach(() => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        form = result.current;
    });

    it('should render receiveCryptoAmount form value', () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', mercuryoFixedWorstQuote);
        });

        const { getByLabelText } = renderExchangeReceiveAmountInput();

        expect(getByLabelText('You get')).toHaveDisplayValue('0.00083554');
    });

    it('should call showAssetsSheet callback on press', () => {
        const showAssetsSheetMock = jest.fn();
        const { getByLabelText } = renderExchangeReceiveAmountInput({
            showAssetsSheet: showAssetsSheetMock,
        });

        fireEvent.press(getByLabelText('You get'));

        expect(showAssetsSheetMock).toHaveBeenCalled();
    });

    it('should display loading skeleton when quotes are being fetched', () => {
        const { getByLabelText } = renderExchangeReceiveAmountInput(
            {},
            { wallet: { trading: { exchange: { isLoading: true } } } },
        );

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });
});
