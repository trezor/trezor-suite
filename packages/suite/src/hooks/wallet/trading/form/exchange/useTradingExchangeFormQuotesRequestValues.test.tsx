import { type CryptoId, type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER,
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FLOATING,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { PROTO } from '@trezor/connect';
import type { StaticSessionId } from '@trezor/connect';

import { useTradingExchangeFormQuotesRequestValues } from './useTradingExchangeFormQuotesRequestValues';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const BTC_ACCOUNT: Account = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('xpubBitcoin'),
});
const ETH_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xEthereum'),
});

const DEFAULT_VALUES: TradingExchangeFormProps = {
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
    sendCryptoSelect: undefined,
    receiveCryptoSelect: null,
    amountInCrypto: true,
    [TRADING_EXCHANGE_RATE]: TRADING_EXCHANGE_RATE_FLOATING,
    [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_CEX,
    [TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]: TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    [TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]: TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
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

const QUOTES_REQUEST: ExchangeTradeQuoteRequest = {
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '0.01',
    dex: 'enable',
};

const SELECTED_DEX_QUOTE: ExchangeTrade = {
    exchange: 'lifi',
    isDex: true,
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '0.01',
    receiveStringAmount: '0.2',
};

type RenderQuotesRequestValuesParams = {
    quotesRequest: ExchangeTradeQuoteRequest | undefined;
    selectedQuote?: ExchangeTrade;
    accountKey?: AccountKey;
    bitcoinAmountUnit?: PROTO.AmountUnit;
};

const renderQuotesRequestValues = ({
    quotesRequest,
    selectedQuote,
    accountKey = BTC_ACCOUNT.key,
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
}: RenderQuotesRequestValuesParams) => {
    const root = createTestCompositionRoot({
        preloadedState: {
            networks: null,
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            wallet: {
                accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
                settings: { bitcoinAmountUnit },
                trading: { info: { coins: undefined, platforms: undefined } },
            },
        },
    });

    return renderHookWithStoreProvider(
        () =>
            useTradingExchangeFormQuotesRequestValues({
                quotesRequest,
                selectedQuote,
                accountKey,
                defaultValues: DEFAULT_VALUES,
            }),
        { root },
    ).result;
};

describe('useTradingExchangeFormQuotesRequestValues', () => {
    it('seeds both assets and the amount on top of the defaults', () => {
        const result = renderQuotesRequestValues({ quotesRequest: QUOTES_REQUEST });

        expect(result.current).toMatchObject({
            sendCryptoSelect: { id: 'bitcoin', accountKey: BTC_ACCOUNT.key },
            receiveCryptoSelect: { id: 'ethereum', networkSymbol: 'eth' },
            outputs: [{ amount: '0.01', currency: { value: 'usd' } }],
            [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_CEX,
            [TRADING_EXCHANGE_RATE]: TRADING_EXCHANGE_RATE_FLOATING,
            provider: undefined,
        });
    });

    it('returns null when the trading account does not hold the requested send asset', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            accountKey: ETH_ACCOUNT.key,
        });

        expect(result.current).toBeNull();
    });

    it('restores the provider and the DEX form of the selected quote', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            selectedQuote: SELECTED_DEX_QUOTE,
        });

        expect(result.current).toMatchObject({
            provider: 'lifi',
            [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_DEX,
        });
    });

    it('converts the send amount to satoshis when bitcoin is displayed in sats', () => {
        const result = renderQuotesRequestValues({
            quotesRequest: QUOTES_REQUEST,
            bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
        });

        expect(result.current?.outputs[0]?.amount).toBe('1000000');
    });
});
