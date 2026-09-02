import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, userEvent } from '@suite-native/test-utils-store';
import { btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';

import {
    ExchangeSendAmountInput,
    type ExchangeSendAmountInputProps,
} from './ExchangeSendAmountInput';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockUseAmountInputDecimals = jest.fn(
    (_account?: Account, _contractAddress?: TokenAddress) => 8,
);

jest.mock('../../../hooks/general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: jest.fn((account?: Account, contractAddress?: TokenAddress) =>
        mockUseAmountInputDecimals(account, contractAddress),
    ),
}));

describe('ExchangeSendAmountInput', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
        },
    };

    const renderCryptoAmountInput = async (
        props: Partial<ExchangeSendAmountInputProps>,
        form: ExchangeFormType,
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <Form form={form}>
                <ExchangeSendAmountInput onSelectAsset={jest.fn()} {...props} />
            </Form>,
            {
                tradeType: 'exchange',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
            },
        );

    const renderUseTradingExchangeForm = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: mergeDeepObject(baseOverrides, extraOverrides),
        });

        return result.current;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set send value in form', async () => {
        const form = await renderUseTradingExchangeForm();
        await act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
            '100',
        );

        expect(form.getValues('sendCryptoAmount')).toEqual('100');
    });

    it('should be disabled when asset is not selected', async () => {
        const form = await renderUseTradingExchangeForm();
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toBeDisabled();
    });

    it('should call showAssetsScreen when disabled and pressed', async () => {
        const showAssetsScreen = jest.fn();
        const form = await renderUseTradingExchangeForm();
        const { getByLabelText } = await renderCryptoAmountInput(
            { onSelectAsset: showAssetsScreen },
            form,
        );

        await userEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        );

        expect(showAssetsScreen).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsScreen when enabled and pressed', async () => {
        const showAssetsScreen = jest.fn();
        const form = await renderUseTradingExchangeForm();
        await act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput(
            { onSelectAsset: showAssetsScreen },
            form,
        );

        await userEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        );

        expect(showAssetsScreen).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const form = await renderUseTradingExchangeForm();
        await act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
            'asd1.123',
        );

        expect(form.getValues('sendCryptoAmount')).toEqual('1.123');
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('1.123');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const satoshiOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingExchangeForm(satoshiOverrides);
        await act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, satoshiOverrides);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
            'asd1.123',
        );

        expect(form.getValues('sendCryptoAmount')).toEqual('1123');
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('1123');
    });

    it('should always escape non-numeric characters', async () => {
        const satoshiOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingExchangeForm(satoshiOverrides);
        await act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, satoshiOverrides);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
            'asd',
        );

        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('');
    });

    it('should limit value to decimals based on useAmountInputDecimals return value', async () => {
        const accountKey = mockAccountKey({ symbol: 'eth', descriptor: 'accountKey' });
        const form = await renderUseTradingExchangeForm();
        await act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendAccount', {
                key: accountKey,
                symbol: 'eth',
            } as Account);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
            '1.0123456789',
        );

        expect(form.getValues('sendCryptoAmount')).toEqual('1.01234567');
        expect(mockUseAmountInputDecimals).toHaveBeenLastCalledWith(
            { key: accountKey, symbol: 'eth' },
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        );
    });
});
