import { useForm } from 'react-hook-form';

import { act } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    type TradingAssetSellOption,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { PROTO } from '@trezor/connect';

import { useTradingAmountUnitSync } from './useTradingAmountUnitSync';

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');

const BITCOIN_ACCOUNT = mockWalletAccount({ symbol: btcSymbol, formattedBalance: '2' });
const ETHEREUM_ACCOUNT = mockWalletAccount({ symbol: ethSymbol, formattedBalance: '5' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

const DEFAULTS: TradingSellFormProps = {
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
    sendCryptoSelect: SEND_CRYPTO_SELECT,
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
};

const renderAmountUnitSync = (account: Account) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        },
    });

    return renderHookWithStoreProvider(
        ({ account: syncedAccount }: { account: Account }) => {
            const methods = useForm<TradingSellFormProps>({
                mode: 'onChange',
                defaultValues: DEFAULTS,
            });
            useTradingAmountUnitSync({
                account: syncedAccount,
                methods,
                cryptoInputName: TRADING_FORM_OUTPUT_AMOUNT,
            });

            return methods;
        },
        { root, initialProps: { account } },
    );
};

describe('useTradingAmountUnitSync', () => {
    it('converts the amount from satoshis when the asset leaves bitcoin', () => {
        const { result, rerender } = renderAmountUnitSync(BITCOIN_ACCOUNT);

        act(() => {
            result.current.setValue(TRADING_FORM_OUTPUT_AMOUNT, '100000');
        });

        rerender({ account: ETHEREUM_ACCOUNT });

        expect(result.current.getValues(TRADING_FORM_OUTPUT_AMOUNT)).toBe('0.001');
    });

    it('converts the amount to satoshis when the asset becomes bitcoin', () => {
        const { result, rerender } = renderAmountUnitSync(ETHEREUM_ACCOUNT);

        act(() => {
            result.current.setValue(TRADING_FORM_OUTPUT_AMOUNT, '1.5');
        });

        rerender({ account: BITCOIN_ACCOUNT });

        expect(result.current.getValues(TRADING_FORM_OUTPUT_AMOUNT)).toBe('150000000');
    });

    it('keeps an empty amount untouched', () => {
        const { result, rerender } = renderAmountUnitSync(BITCOIN_ACCOUNT);

        rerender({ account: ETHEREUM_ACCOUNT });

        expect(result.current.getValues(TRADING_FORM_OUTPUT_AMOUNT)).toBe('');
    });
});
