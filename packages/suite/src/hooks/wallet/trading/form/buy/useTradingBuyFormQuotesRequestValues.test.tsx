import { type BuyTrade, type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingBuyFormProps } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { useTradingBuyFormQuotesRequestValues } from './useTradingBuyFormQuotesRequestValues';

const btcSymbol = asNetworkSymbol('btc');

const DEFAULT_VALUES: TradingBuyFormProps = {
    fiatInput: undefined,
    cryptoInput: undefined,
    currencySelect: { value: 'usd', label: 'USD' },
    cryptoSelect: {
        isNativeToken: true,
        id: 'bitcoin' as CryptoId,
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        symbol: btcSymbol,
        displaySymbol: 'BTC',
        contractAddress: null,
        networkName: 'Bitcoin',
        networkSymbol: btcSymbol,
    },
    countrySelect: {
        value: 'CZ',
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    paymentMethod: { value: '', label: '' },
    provider: undefined,
    amountInCrypto: false,
    receiveAddress: undefined,
};

const FIAT_QUOTES_REQUEST: BuyTradeQuoteRequest = {
    wantCrypto: false,
    fiatCurrency: 'EUR',
    receiveCurrency: 'bitcoin' as CryptoId,
    fiatStringAmount: '100',
    cryptoStringAmount: '0.001',
    country: 'CZ',
};

const CRYPTO_QUOTES_REQUEST: BuyTradeQuoteRequest = {
    ...FIAT_QUOTES_REQUEST,
    wantCrypto: true,
};

const SELECTED_QUOTE: BuyTrade = {
    exchange: 'mercuryo',
    paymentMethod: 'applePay',
    paymentMethodName: 'Apple Pay',
    fiatCurrency: 'EUR',
    receiveCurrency: 'bitcoin' as CryptoId,
    fiatStringAmount: '100',
    receiveStringAmount: '0.001',
};

type RenderQuotesRequestValuesParams = {
    quotesRequest: BuyTradeQuoteRequest | undefined;
    selectedQuote?: BuyTrade;
    bitcoinAmountUnit?: PROTO.AmountUnit;
};

const renderQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
}: RenderQuotesRequestValuesParams) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            networks: null,
            wallet: {
                settings: { bitcoinAmountUnit },
                trading: { info: { coins: undefined, platforms: undefined } },
            },
        },
    });

    return renderHookWithStoreProvider(
        () =>
            useTradingBuyFormQuotesRequestValues({
                quotesRequest,
                selectedQuote,
                defaultValues: DEFAULT_VALUES,
            }),
        { root },
    ).result;
};

describe('useTradingBuyFormQuotesRequestValues', () => {
    it('fills only the fiat side when the fiat amount was typed', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: { ...FIAT_QUOTES_REQUEST, paymentMethod: 'creditCard' },
        });

        expect(result.current).toMatchObject({
            amountInCrypto: false,
            fiatInput: '100',
            paymentMethod: { value: 'creditCard', label: 'creditCard' },
        });
        expect(result.current?.cryptoInput).toBeUndefined();
    });

    it('fills only the crypto side when the crypto amount was typed', () => {
        const result = renderQuotesRequestValues({ quotesRequest: CRYPTO_QUOTES_REQUEST });

        expect(result.current).toMatchObject({ amountInCrypto: true, cryptoInput: '0.001' });
        expect(result.current?.fiatInput).toBeUndefined();
    });

    it('restores the provider and payment method of the selected quote', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: FIAT_QUOTES_REQUEST,
            selectedQuote: SELECTED_QUOTE,
        });

        expect(result.current).toMatchObject({
            provider: 'mercuryo',
            paymentMethod: { value: 'applePay', label: 'Apple Pay' },
        });
    });

    it('converts the crypto amount to satoshis when bitcoin is displayed in sats', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: CRYPTO_QUOTES_REQUEST,
            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
        });

        expect(result.current?.cryptoInput).toBe('100000');
    });
});
