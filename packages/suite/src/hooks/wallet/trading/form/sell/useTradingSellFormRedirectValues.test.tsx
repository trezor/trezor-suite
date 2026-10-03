import { type CryptoId, type SellFiatTradeQuoteRequest } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { PROTO } from '@trezor/connect';
import type { StaticSessionId } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';

import { useTradingSellFormRedirectValues } from './useTradingSellFormRedirectValues';

const btcSymbol = asNetworkSymbol('btc');

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const BTC_ACCOUNT: Account = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('xpubBitcoin'),
});

const QUOTES_REQUEST: SellFiatTradeQuoteRequest = {
    amountInCrypto: true,
    cryptoCurrency: 'bitcoin' as CryptoId,
    fiatCurrency: 'EUR',
    cryptoStringAmount: '0.01',
    fiatStringAmount: '500',
    country: 'CZ',
};

const renderRedirectValues = (bitcoinAmountUnit: PROTO.AmountUnit) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            networks: null,
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            wallet: {
                accounts: [BTC_ACCOUNT],
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
        () => useTradingSellFormRedirectValues(true, QUOTES_REQUEST),
        { services },
    ).result;
};

describe('useTradingSellFormRedirectValues', () => {
    it('restores the redirect request and the composed fee into the form', () => {
        const result = renderRedirectValues(PROTO.AmountUnit.BITCOIN);

        expect(result.current).toMatchObject({
            amountInCrypto: true,
            sendCryptoSelect: { id: 'bitcoin', accountKey: BTC_ACCOUNT.key },
            countrySelect: { value: 'CZ' },
            outputs: [{ amount: '0.01', fiat: '500', currency: { value: 'eur' } }],
            feePerUnit: '12',
            selectedFee: 'custom',
        });
    });

    it('converts the crypto amount to satoshis when bitcoin is displayed in sats', () => {
        const result = renderRedirectValues(PROTO.AmountUnit.SATOSHI);

        expect(result.current?.outputs[0]?.amount).toBe('1000000');
    });
});
