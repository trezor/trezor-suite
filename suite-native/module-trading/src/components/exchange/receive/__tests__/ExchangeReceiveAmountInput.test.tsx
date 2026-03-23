import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import {
    exchangeQuotes,
    getInitializedTradingState,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeReceiveAmountInput,
    type ExchangeReceiveAmountInputProps,
} from '../ExchangeReceiveAmountInput';

describe('ExchangeReceiveAmountInput', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProvider(() => useExchangeForm());

    const renderExchangeReceiveAmountInput = (
        props: Partial<ExchangeReceiveAmountInputProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(
            <ExchangeReceiveAmountInput showAssetsSheet={jest.fn()} {...props} />,
            { preloadedState, wrapper: ({ children }) => <Form form={form}>{children}</Form> },
        );

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render receiveCryptoAmount form value', () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', exchangeQuotes[0]);
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
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.exchange.isLoading = true;

        const { getByLabelText } = renderExchangeReceiveAmountInput({}, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });
});
