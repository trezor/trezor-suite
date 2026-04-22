import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { act, userEvent } from '@suite-native/test-utils-store';
import { btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeSendAmountInput,
    type ExchangeSendAmountInputProps,
} from '../ExchangeSendAmountInput';

const mockUseAmountInputDecimals = jest.fn(
    (_account?: Account, _contractAddress?: TokenAddress) => 8,
);

jest.mock('../../../../hooks/general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: jest.fn((account?: Account, contractAddress?: TokenAddress) =>
        mockUseAmountInputDecimals(account, contractAddress),
    ),
}));

describe('ExchangeSendAmountInput', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
        },
    };

    const renderCryptoAmountInput = (
        props: Partial<ExchangeSendAmountInputProps>,
        form: ExchangeFormType,
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <Form form={form}>
                <ExchangeSendAmountInput showAssetsSheet={jest.fn()} {...props} />
            </Form>,
            {
                tradeType: 'exchange',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
            },
        );

    const renderUseTradingExchangeForm = (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: mergeDeepObject(baseOverrides, extraOverrides),
        });

        return result.current;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set send value in form', async () => {
        const form = renderUseTradingExchangeForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), '100');

        expect(form.getValues('sendCryptoAmount')).toEqual('100');
    });

    it('should be disabled when asset is not selected', () => {
        const form = renderUseTradingExchangeForm();
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        expect(getByLabelText('You pay')).toBeDisabled();
    });

    it('should call showAssetsSheet when disabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = renderUseTradingExchangeForm();
        const { getByLabelText } = renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You pay'));

        expect(showAssetsSheet).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsSheet when enabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = renderUseTradingExchangeForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You pay'));

        expect(showAssetsSheet).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const form = renderUseTradingExchangeForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('sendCryptoAmount')).toEqual('1.123');
        expect(getByLabelText('You pay')).toHaveDisplayValue('1.123');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const satoshiOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = renderUseTradingExchangeForm(satoshiOverrides);
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form, satoshiOverrides);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('sendCryptoAmount')).toEqual('1123');
        expect(getByLabelText('You pay')).toHaveDisplayValue('1123');
    });

    it('should always escape non-numeric characters', async () => {
        const satoshiOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = renderUseTradingExchangeForm(satoshiOverrides);
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form, satoshiOverrides);

        await userEvent.type(getByLabelText('You pay'), 'asd');

        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(getByLabelText('You pay')).toHaveDisplayValue('');
    });

    it('should limit value to decimals based on useAmountInputDecimals return value', async () => {
        const form = renderUseTradingExchangeForm();
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendAccount', {
                key: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'eth',
            } as Account);
        });
        const { getByLabelText } = renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), '1.0123456789');

        expect(form.getValues('sendCryptoAmount')).toEqual('1.01234567');
        expect(mockUseAmountInputDecimals).toHaveBeenLastCalledWith(
            { key: 'account-key', symbol: 'eth' },
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        );
    });
});
