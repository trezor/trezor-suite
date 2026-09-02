import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, userEvent } from '@suite-native/test-utils-store';
import { btcAsset } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { BuyCryptoAmountInput, type CryptoAmountInputProps } from './BuyCryptoAmountInput';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe('BuyCryptoAmountInput', () => {
    const renderCryptoAmountInput = async (
        props: Partial<CryptoAmountInputProps>,
        form: BuyFormType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <Form form={form}>
                <BuyCryptoAmountInput showAssetsSheet={jest.fn()} {...props} />
            </Form>,
            { overrides },
        );

    const renderUseTradingBuyForm = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const { result } = await renderHookWithTradingProvider(() => useBuyForm(), {
            overrides,
        });

        return result.current;
    };

    it('should set fiat value in form', async () => {
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            '100',
        );

        expect(form.getValues('cryptoValue')).toEqual('100');
    });

    it('should be disabled when asset is not selected', async () => {
        const form = await renderUseTradingBuyForm();
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toBeDisabled();
    });

    it('should call showAssetsSheet when disabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = await renderUseTradingBuyForm();
        const { getByLabelText } = await renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        );

        expect(showAssetsSheet).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsSheet when enabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        );

        expect(showAssetsSheet).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            'asd1.123',
        );

        expect(form.getValues('cryptoValue')).toEqual('1.123');
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('1.123');
    });

    it('should preserve a leading-zero decimal while typing', async () => {
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);
        const input = getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel'));

        await userEvent.type(input, '0.0001');

        expect(form.getValues('cryptoValue')).toEqual('0.0001');
        expect(input).toHaveDisplayValue('0.0001');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            'asd1.123',
        );

        expect(form.getValues('cryptoValue')).toEqual('1123');
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('1123');
    });

    it('should always escape non-numeric characters', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            'asd',
        );

        expect(form.getValues('cryptoValue')).toBeUndefined();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('');
    });

    it('should display loading skeleton while amountInCrypto is false and buyInfo is loading', async () => {
        const form = await renderUseTradingBuyForm();

        const { getByLabelText } = await renderCryptoAmountInput({}, form, {
            wallet: { trading: { buy: { isLoading: true } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeTruthy();
    });

    it('should not display loading skeleton while amountInCrypto is true and buyInfo is loading', async () => {
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('amountInCrypto', true);
        });

        const { queryByLabelText } = await renderCryptoAmountInput({}, form, {
            wallet: { trading: { buy: { isLoading: true } } },
        });

        expect(
            queryByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeNull();
    });

    it('should limit value to 9 decimals', async () => {
        const form = await renderUseTradingBuyForm();
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            '1.0123456789',
        );

        expect(form.getValues('cryptoValue')).toEqual('1.012345678');
    });
});
