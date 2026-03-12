import { Form } from '@suite-native/forms';
import { act, fireEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    exchangeQuotes,
    getInitializedTradingState,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeReceiveAmountInput,
    ExchangeReceiveAmountInputProps,
} from '../ExchangeReceiveAmountInput';

describe('ExchangeReceiveAmountInput', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeReceiveAmountInput = (
        props: Partial<ExchangeReceiveAmountInputProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ExchangeReceiveAmountInput showAssetsSheet={jest.fn()} {...props} />,
            { preloadedState, wrapper: ({ children }) => <Form form={form}>{children}</Form> },
        );

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render receiveCryptoAmount form value', async () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', exchangeQuotes[0]);
        });

        const { getByLabelText } = await renderExchangeReceiveAmountInput();

        expect(getByLabelText('You get')).toHaveDisplayValue('0.00083554');
    });

    it('should call showAssetsSheet callback on press', async () => {
        const showAssetsSheetMock = jest.fn();
        const { getByLabelText } = await renderExchangeReceiveAmountInput({
            showAssetsSheet: showAssetsSheetMock,
        });

        fireEvent.press(getByLabelText('You get'));

        expect(showAssetsSheetMock).toHaveBeenCalled();
    });

    it('should display loading skeleton when quotes are being fetched', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.exchange.isLoading = true;

        const { getByLabelText } = await renderExchangeReceiveAmountInput({}, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });
});
