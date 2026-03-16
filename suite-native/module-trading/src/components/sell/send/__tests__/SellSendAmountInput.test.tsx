import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellSendAmountInput, type SellSendAmountInputProps } from '../SellSendAmountInput';

const mockUseAmountInputDecimals = jest.fn(
    (_account?: Account, _contractAddress?: TokenAddress) => 8,
);

jest.mock('../../../../hooks/general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: jest.fn((account?: Account, contractAddress?: TokenAddress) =>
        mockUseAmountInputDecimals(account, contractAddress),
    ),
}));

describe('SellSendAmountInput', () => {
    const renderCryptoAmountInput = (
        props: Partial<SellSendAmountInputProps>,
        form: SellFormType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <SellSendAmountInput showAssetsSheet={jest.fn()} {...props} />
            </Form>,
            { preloadedState },
        );

    const renderUseTradingSellForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useSellForm(), {
            preloadedState,
        });

        return result.current;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set send value in form', async () => {
        const form = await renderUseTradingSellForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), '100');

        expect(form.getValues('cryptoStringAmount')).toEqual('100');
    });

    it('should be disabled when asset is not selected', async () => {
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        expect(getByLabelText('You pay')).toBeDisabled();
    });

    it('should call showAssetsSheet when disabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = await renderUseTradingSellForm();
        const { getByLabelText } = await renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You pay'));

        expect(showAssetsSheet).toHaveBeenCalledTimes(1);
    });

    it('should not call showAssetsSheet when enabled and pressed', async () => {
        const showAssetsSheet = jest.fn();
        const form = await renderUseTradingSellForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({ showAssetsSheet }, form);

        await userEvent.press(getByLabelText('You pay'));

        expect(showAssetsSheet).not.toHaveBeenCalled();
    });

    it('should format input value to be decimal by default', async () => {
        const form = await renderUseTradingSellForm();
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('cryptoStringAmount')).toEqual('1.123');
        expect(getByLabelText('You pay')).toHaveDisplayValue('1.123');
    });

    it('should format input value to be integer when BTC asset is selected and value should be displayed in sats', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingSellForm(preloadedState);
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(getByLabelText('You pay'), 'asd1.123');

        expect(form.getValues('cryptoStringAmount')).toEqual('1123');
        expect(getByLabelText('You pay')).toHaveDisplayValue('1123');
    });

    it('should always escape non-numeric characters', async () => {
        const preloadedState = {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        };
        const form = await renderUseTradingSellForm(preloadedState);
        act(() => {
            form.setValue('sendAsset', btcAsset);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        await userEvent.type(getByLabelText('You pay'), 'asd');

        expect(form.getValues('cryptoStringAmount')).toBeUndefined();
        expect(getByLabelText('You pay')).toHaveDisplayValue('');
    });

    it('should limit value to decimals based on useAmountInputDecimals return value', async () => {
        const form = await renderUseTradingSellForm();
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendAccount', {
                key: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`,
                symbol: 'eth',
            } as Account);
        });
        const { getByLabelText } = await renderCryptoAmountInput({}, form);

        await userEvent.type(getByLabelText('You pay'), '1.0123456789');

        expect(form.getValues('cryptoStringAmount')).toEqual('1.01234567');
        expect(mockUseAmountInputDecimals).toHaveBeenLastCalledWith(
            { key: 'account-key', symbol: 'eth' },
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        );
    });

    it('should display loading skeleton while amountInCrypto is false and quotes are loading', async () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        preloadedState.wallet!.trading!.sell!.isLoading = true;
        const form = await renderUseTradingSellForm(preloadedState);

        act(() => {
            form.setValue('amountInCrypto', false);
        });

        const { getByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });

    it('should not display loading skeleton when amountInCrypto is true', async () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        preloadedState.wallet!.trading!.sell!.isLoading = true;
        const form = await renderUseTradingSellForm(preloadedState);

        act(() => {
            form.setValue('amountInCrypto', true);
        });

        const { queryByLabelText } = await renderCryptoAmountInput({}, form, preloadedState);

        expect(queryByLabelText('Fetching offers...')).toBeNull();
    });
});
