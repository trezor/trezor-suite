import { type CryptoId, type SellFiatTrade, type SellFiatTradeQuoteRequest } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingSellFormProps } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { PROTO } from '@trezor/connect';
import type { StaticSessionId } from '@trezor/connect';

import { useTradingSellFormQuotesRequestValues } from './useTradingSellFormQuotesRequestValues';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const FIRST_BTC_ACCOUNT: Account = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('xpubFirstBitcoin'),
});
const SECOND_BTC_ACCOUNT: Account = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('xpubSecondBitcoin'),
});
const ETH_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xEthereum'),
});

const DEFAULT_VALUES: TradingSellFormProps = {
    outputs: [
        {
            type: 'payment',
            address: '',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    countrySelect: {
        value: 'US',
        codeAlpha3: 'USA',
        flag: '🇺🇸',
        name: 'United States',
        label: '🇺🇸 United States',
        shortLabel: '🇺🇸 USA',
    },
    sendCryptoSelect: undefined,
    amountInCrypto: true,
    paymentMethod: { value: '', label: '' },
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

const QUOTES_REQUEST: SellFiatTradeQuoteRequest = {
    amountInCrypto: true,
    cryptoCurrency: 'bitcoin' as CryptoId,
    fiatCurrency: 'EUR',
    cryptoStringAmount: '0.01',
    fiatStringAmount: '500',
    country: 'CZ',
};

const SELECTED_QUOTE: SellFiatTrade = {
    exchange: 'banxa',
    paymentMethod: 'bankTransfer',
    paymentMethodName: 'Bank Transfer',
    amountInCrypto: true,
    cryptoCurrency: 'bitcoin' as CryptoId,
    fiatCurrency: 'EUR',
    cryptoStringAmount: '0.01',
    fiatStringAmount: '500',
};

type RenderQuotesRequestValuesParams = {
    quotesRequest: SellFiatTradeQuoteRequest | undefined;
    selectedQuote?: SellFiatTrade;
    accountKey?: AccountKey;
    isFromRedirect?: boolean;
    bitcoinAmountUnit?: PROTO.AmountUnit;
};

const renderQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    accountKey,
    isFromRedirect = false,
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
}: RenderQuotesRequestValuesParams) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            networks: null,
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            wallet: {
                accounts: [FIRST_BTC_ACCOUNT, SECOND_BTC_ACCOUNT, ETH_ACCOUNT],
                settings: { bitcoinAmountUnit },
                trading: {
                    info: { coins: undefined, platforms: undefined },
                    composedTransactionInfo: {
                        selectedFee: 'custom',
                        composed: { feePerByte: '12', feeLimit: '', fee: '' },
                    },
                },
            },
        },
    });

    return renderHookWithStoreProvider(
        () =>
            useTradingSellFormQuotesRequestValues({
                quotesRequest,
                selectedQuote,
                accountKey,
                isFromRedirect,
                defaultValues: DEFAULT_VALUES,
            }),
        { root },
    ).result;
};

describe('useTradingSellFormQuotesRequestValues', () => {
    it('sends from the trading account when it holds the requested asset', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            accountKey: SECOND_BTC_ACCOUNT.key,
        });

        expect(result.current).toMatchObject({
            amountInCrypto: true,
            sendCryptoSelect: { id: 'bitcoin', accountKey: SECOND_BTC_ACCOUNT.key },
            countrySelect: { value: 'CZ' },
            outputs: [{ amount: '0.01', fiat: '500', currency: { value: 'eur' } }],
            feePerUnit: '',
        });
        expect(result.current?.selectedFee).toBeUndefined();
    });

    it('returns null when the trading account does not hold the requested asset', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            accountKey: ETH_ACCOUNT.key,
        });

        expect(result.current).toBeNull();
    });

    it('restores the provider and payment method of the selected quote', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            selectedQuote: SELECTED_QUOTE,
            accountKey: FIRST_BTC_ACCOUNT.key,
        });

        expect(result.current).toMatchObject({
            provider: 'banxa',
            paymentMethod: { value: 'bankTransfer', label: 'Bank Transfer' },
        });
    });

    it('seeds the fee from the composed transaction only in the redirect flow', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            accountKey: FIRST_BTC_ACCOUNT.key,
            isFromRedirect: true,
        });

        expect(result.current).toMatchObject({ feePerUnit: '12', selectedFee: 'custom' });
    });

    it('converts the crypto amount to satoshis when bitcoin is displayed in sats', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            accountKey: FIRST_BTC_ACCOUNT.key,
            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
        });

        expect(result.current?.outputs[0]?.amount).toBe('1000000');
    });
});
