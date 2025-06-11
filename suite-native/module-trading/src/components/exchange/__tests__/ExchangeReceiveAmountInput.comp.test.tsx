import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { usdcAsset } from '../../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
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
            form.setValue('receiveCryptoAmount', '0.01');
        });

        const { getByLabelText } = await renderExchangeReceiveAmountInput();

        expect(getByLabelText('You get')).toHaveDisplayValue('0.01');
    });

    it('should call showAssetsSheet callback on press', async () => {
        const showAssetsSheetMock = jest.fn();
        const { getByLabelText } = await renderExchangeReceiveAmountInput({
            showAssetsSheet: showAssetsSheetMock,
        });

        fireEvent.press(getByLabelText('You get'));

        expect(showAssetsSheetMock).toHaveBeenCalled();
    });
});
