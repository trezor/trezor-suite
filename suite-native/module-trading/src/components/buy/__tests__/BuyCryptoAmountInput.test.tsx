import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils';
import { btcAsset, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyCryptoAmountInput, type CryptoAmountInputProps } from '../BuyCryptoAmountInput';

describe('BuyCryptoAmountInput', () => {
    const renderCryptoAmountInput = (
        props: Partial<CryptoAmountInputProps>,
        form: BuyFormType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(
            <Form form={form}>
                <BuyCryptoAmountInput showAssetsSheet={jest.fn()} {...props} />
            </Form>,
            { preloadedState },
        );

    const renderUseTradingBuyForm = (preloadedState: PreloadedState = {}) => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You get'), '100');

        expect(form.getValues('cryptoValue')).toEqual('100');
    });

    it('should be disabled when asset is not selected', () => {
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        expect(getByLabelText('You get')).toBeDisabled();
    });

    it('should call showAssetsSheet when disabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = renderUseTradingBuyForm();
        const { getByLabelText } = renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You get'));

        expect(showAssetsSheet).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsSheet when enabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You get'));

        expect(showAssetsSheet).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You get'), 'asd1.123');

        expect(form.getValues('cryptoValue')).toEqual('1.123');
        expect(getByLabelText('You get')).toHaveDisplayValue('1.123');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(getByLabelText('You get'), 'asd1.123');

        expect(form.getValues('cryptoValue')).toEqual('1123');
        expect(getByLabelText('You get')).toHaveDisplayValue('1123');
    });

    it('should always escape non-numeric characters', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(getByLabelText('You get'), 'asd');

        expect(form.getValues('cryptoValue')).toBeUndefined();
        expect(getByLabelText('You get')).toHaveDisplayValue('');
    });

    it('should display loading skeleton while amountInCrypto is false and buyInfo is loading', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.buy.isLoading = true;
        const form = renderUseTradingBuyForm();

        const { getByLabelText } = renderCryptoAmountInput({}, form, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });

    it('should not display loading skeleton while amountInCrypto is true and buyInfo is loading', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        preloadedState.wallet.trading.buy.isLoading = true;
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('amountInCrypto', true);
        });

        const { queryByLabelText } = renderCryptoAmountInput({}, form, preloadedState);

        expect(queryByLabelText('Fetching offers...')).toBeNull();
    });

    it('should limit value to 9 decimals', async () => {
        const form = renderUseTradingBuyForm();
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You get'), '1.0123456789');

        expect(form.getValues('cryptoValue')).toEqual('1.012345678');
    });
});
