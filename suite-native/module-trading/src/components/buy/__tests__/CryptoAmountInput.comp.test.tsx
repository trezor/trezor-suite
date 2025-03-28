import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { CryptoAmountInput, CryptoAmountInputProps } from '../CryptoAmountInput';

describe('CryptoAmountInput', () => {
    const renderCryptoAmountInput = (
        props: Partial<CryptoAmountInputProps>,
        form: TradingBuyForm,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <CryptoAmountInput showAssetsSheet={jest.fn()} {...props} />
            </Form>,
            { preloadedState },
        );

    it('should set fiat value in form', async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        act(() => {
            result.current.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, result.current);

        await userEvent.type(getByLabelText('You get'), '100');

        expect(result.current.getValues('cryptoValue')).toEqual('100');
    });

    it('should be disabled when asset is not selected', async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        const { getByLabelText } = await renderCryptoAmountInput({}, result.current);

        expect(getByLabelText('You get')).toBeDisabled();
    });

    it('should call showAssetsSheet when disabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        const { getByLabelText } = await renderCryptoAmountInput(
            { showAssetsSheet },
            result.current,
        );

        await userEvent.press(getByLabelText('You get'));

        expect(showAssetsSheet).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsSheet when enabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        act(() => {
            result.current.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput(
            { showAssetsSheet },
            result.current,
        );

        await userEvent.press(getByLabelText('You get'));

        expect(showAssetsSheet).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        act(() => {
            result.current.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, result.current);

        await userEvent.type(getByLabelText('You get'), 'asd1.123');

        expect(result.current.getValues('cryptoValue')).toEqual('1.123');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const preloadedState = {
            appSettings: { bitcoinUnits: PROTO.AmountUnit.SATOSHI },
        };
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        act(() => {
            result.current.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput(
            {},
            result.current,
            preloadedState,
        );

        await userEvent.type(getByLabelText('You get'), 'asd1.123');

        expect(result.current.getValues('cryptoValue')).toEqual('1123');
    });
});
