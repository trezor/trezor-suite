import { useForm } from 'react-hook-form';

import { act, renderHook, waitFor } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import {
    type TradingAssetSellOption,
    type TradingFiatRatesReturn,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingCryptoAssetChange } from '../useTradingCryptoAssetChange';

const ACCOUNT = mockWalletAccount({ symbol: 'btc', formattedBalance: '2' });
const OTHER_ACCOUNT = mockWalletAccount({ symbol: 'eth', formattedBalance: '5' });

const buildSelect = (accountKey: AccountKey): TradingAssetSellOption => ({
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: 'btc',
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
    accountKey,
});

const buildDefaults = (sendCryptoSelect: TradingAssetSellOption): TradingSellFormProps => ({
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    countrySelect: {
        value: 'CZ' as const,
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    sendCryptoSelect,
    amountInCrypto: true,
    paymentMethod: undefined,
    provider: undefined,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
});

const TRADING_FIAT_VALUES: TradingFiatRatesReturn = {
    fiatValue: null,
    fiatRate: undefined,
    accountBalance: '2',
    formattedBalance: '2',
    symbol: 'btc',
    networkDecimals: 8,
    tokenAddress: undefined,
    fiatRatesUpdater: jest.fn(() => Promise.resolve(null)),
};

const renderCryptoAssetChange = (sendCryptoSelect: TradingAssetSellOption) => {
    const setAccountOnChange = jest.fn();
    const setAmountLimits = jest.fn();
    const setComposedLevels = jest.fn();
    const changeFeeLevel = jest.fn();

    const utils = renderHook(() => {
        const methods = useForm<TradingSellFormProps>({
            mode: 'onChange',
            defaultValues: buildDefaults(sendCryptoSelect),
        });
        const change = useTradingCryptoAssetChange({
            account: ACCOUNT,
            accounts: [ACCOUNT, OTHER_ACCOUNT],
            methods,
            tradingFiatValues: TRADING_FIAT_VALUES,
            setAmountLimits,
            changeFeeLevel,
            setComposedLevels,
            setAccountOnChange,
        });

        return { change, methods };
    });

    return { ...utils, setAccountOnChange, setAmountLimits, setComposedLevels, changeFeeLevel };
};

describe('useTradingCryptoAssetChange', () => {
    it('onCryptoCurrencyChange resets amount fields and switches the send account', async () => {
        const { result, setAccountOnChange, setAmountLimits, setComposedLevels, changeFeeLevel } =
            renderCryptoAssetChange(buildSelect(ACCOUNT.key));

        act(() => {
            result.current.methods.setValue('outputs.0.amount', '1');
            result.current.methods.setValue('outputs.0.fiat', '50000');
        });

        await act(async () => {
            await result.current.change.onCryptoCurrencyChange(buildSelect(OTHER_ACCOUNT.key));
        });

        expect(result.current.methods.getValues('outputs.0.amount')).toBe('');
        expect(result.current.methods.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.methods.getValues('setMaxOutputId')).toBeUndefined();
        expect(setAmountLimits).toHaveBeenCalledWith(undefined);
        expect(setComposedLevels).toHaveBeenCalledWith(undefined);
        expect(changeFeeLevel).toHaveBeenCalledWith('normal');
        expect(setAccountOnChange).toHaveBeenCalledWith(OTHER_ACCOUNT);
    });

    it('onCryptoCurrencyChange is a no-op when the same asset is reselected', async () => {
        const { result, setAccountOnChange } = renderCryptoAssetChange(buildSelect(ACCOUNT.key));

        await act(async () => {
            await result.current.change.onCryptoCurrencyChange(buildSelect(ACCOUNT.key));
        });

        expect(setAccountOnChange).not.toHaveBeenCalled();
    });

    it('syncs the send account to the selected asset when it differs from the active account', async () => {
        const { setAccountOnChange } = renderCryptoAssetChange(buildSelect(OTHER_ACCOUNT.key));

        await waitFor(() => expect(setAccountOnChange).toHaveBeenCalledWith(OTHER_ACCOUNT));
    });
});
