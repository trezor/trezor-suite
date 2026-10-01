import { type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { PROTO } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';

import { useTradingBuyFormRedirectValues } from './useTradingBuyFormRedirectValues';

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

const renderRedirectValues = (
    quotesRequest: BuyTradeQuoteRequest,
    bitcoinAmountUnit: PROTO.AmountUnit = PROTO.AmountUnit.BITCOIN,
) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            networks: null,
            wallet: {
                settings: { bitcoinAmountUnit },
                trading: { info: { coins: undefined, platforms: undefined } },
            },
        },
    });

    return renderHookWithStoreProvider(() => useTradingBuyFormRedirectValues(true, quotesRequest), {
        services,
    }).result;
};

describe('useTradingBuyFormRedirectValues', () => {
    it('fills only the fiat side when the fiat amount was typed', () => {
        const result = renderRedirectValues(FIAT_QUOTES_REQUEST);

        expect(result.current).toMatchObject({
            amountInCrypto: false,
            fiatInput: '100',
            cryptoSelect: { id: 'bitcoin' },
            currencySelect: { value: 'eur' },
            countrySelect: { value: 'CZ' },
        });
        expect(result.current?.cryptoInput).toBeUndefined();
    });

    it('converts the crypto amount to satoshis when bitcoin is displayed in sats', () => {
        const result = renderRedirectValues(CRYPTO_QUOTES_REQUEST, PROTO.AmountUnit.SATOSHI);

        expect(result.current).toMatchObject({ amountInCrypto: true, cryptoInput: '100000' });
        expect(result.current?.fiatInput).toBeUndefined();
    });
});
