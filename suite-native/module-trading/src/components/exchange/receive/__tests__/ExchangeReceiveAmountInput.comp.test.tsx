import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../../__fixtures__/exchangeQuotes';
import { usdcAsset } from '../../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../../types/exchange';
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
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        preloadedState.wallet.tradingNew.exchange.isLoading = true;

        const { getByLabelText } = await renderExchangeReceiveAmountInput({}, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });
});
