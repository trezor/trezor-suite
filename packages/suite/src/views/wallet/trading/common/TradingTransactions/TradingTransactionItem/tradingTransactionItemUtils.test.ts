import { type BuyTrade, type CryptoId, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import {
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { CheckIcon, SpinnerGapIcon, WarningIcon } from '@trezor/icons';

import {
    getTradingTransactionSides,
    getTradingTransactionStatusData,
} from './tradingTransactionItemUtils';

const BITCOIN = 'bitcoin' as CryptoId;
const ETHEREUM = 'ethereum' as CryptoId;
const ACCOUNT_KEY = 'descriptor-btc-descriptor@deviceId:0' as AccountKey;

const buyTrade: BuyTrade = {
    fiatStringAmount: '1000',
    fiatCurrency: 'EUR',
    receiveStringAmount: '0.02',
    receiveCurrency: BITCOIN,
};

const sellTrade: SellFiatTrade = {
    cryptoStringAmount: '0.5',
    cryptoCurrency: ETHEREUM,
    fiatStringAmount: '900',
    fiatCurrency: 'USD',
};

const exchangeTrade: ExchangeTrade = {
    sendStringAmount: '0.5',
    send: ETHEREUM,
    receiveStringAmount: '0.02',
    receive: BITCOIN,
};

const buildBuyTransaction = (data: BuyTrade): TradingTransactionBuy => ({
    tradeType: 'buy',
    key: 'buy',
    date: '2026-01-01T00:00:00Z',
    data,
    selectedAccountKey: ACCOUNT_KEY,
    receiveAccountKey: ACCOUNT_KEY,
});

const buildSellTransaction = (data: SellFiatTrade): TradingTransactionSell => ({
    tradeType: 'sell',
    key: 'sell',
    date: '2026-01-01T00:00:00Z',
    data,
    sendAccountKey: ACCOUNT_KEY,
});

const buildExchangeTransaction = (data: ExchangeTrade): TradingTransactionExchange => ({
    tradeType: 'exchange',
    key: 'exchange',
    date: '2026-01-01T00:00:00Z',
    data,
    sendAccountKey: ACCOUNT_KEY,
    receiveAccountKey: ACCOUNT_KEY,
});

describe('getTradingTransactionSides', () => {
    it('maps a buy trade to a fiat side and a crypto side', () => {
        expect(getTradingTransactionSides(buyTrade)).toEqual({
            from: { type: 'fiat', amount: '1000', fiatCurrency: 'EUR' },
            to: { type: 'crypto', amount: '0.02', cryptoId: BITCOIN },
        });
    });

    it('maps a sell trade to a crypto side and a fiat side', () => {
        expect(getTradingTransactionSides(sellTrade)).toEqual({
            from: { type: 'crypto', amount: '0.5', cryptoId: ETHEREUM },
            to: { type: 'fiat', amount: '900', fiatCurrency: 'USD' },
        });
    });

    it('maps an exchange trade to two crypto sides', () => {
        expect(getTradingTransactionSides(exchangeTrade)).toEqual({
            from: { type: 'crypto', amount: '0.5', cryptoId: ETHEREUM },
            to: { type: 'crypto', amount: '0.02', cryptoId: BITCOIN },
        });
    });

    it('returns nothing when a side has no amount or no currency', () => {
        expect(
            getTradingTransactionSides({ ...exchangeTrade, sendStringAmount: undefined }),
        ).toBeUndefined();
        expect(
            getTradingTransactionSides({ ...buyTrade, receiveCurrency: undefined }),
        ).toBeUndefined();
    });
});

describe('getTradingTransactionStatusData', () => {
    it('returns nothing for a trade without a status', () => {
        expect(getTradingTransactionStatusData(buildBuyTransaction(buyTrade))).toBeUndefined();
    });

    it('maps buy statuses to the buy status messages', () => {
        expect(
            getTradingTransactionStatusData(
                buildBuyTransaction({ ...buyTrade, status: 'WAITING_FOR_USER' }),
            ),
        ).toEqual({
            icon: SpinnerGapIcon,
            intent: 'warning',
            messageId: 'TR_BUY_STATUS_ACTION_REQUIRED',
        });
        expect(
            getTradingTransactionStatusData(
                buildBuyTransaction({ ...buyTrade, status: 'BLOCKED' }),
            ),
        ).toEqual({ icon: WarningIcon, intent: 'critical', messageId: 'TR_BUY_STATUS_ERROR' });
        expect(
            getTradingTransactionStatusData(
                buildBuyTransaction({ ...buyTrade, status: 'SUCCESS' }),
            ),
        ).toEqual({ icon: CheckIcon, intent: 'brand', messageId: 'TR_BUY_STATUS_SUCCESS' });
    });

    it('maps sell statuses to the sell status messages', () => {
        expect(
            getTradingTransactionStatusData(
                buildSellTransaction({ ...sellTrade, status: 'SEND_CRYPTO' }),
            ),
        ).toEqual({ icon: SpinnerGapIcon, intent: 'warning', messageId: 'TR_SELL_STATUS_PENDING' });
        expect(
            getTradingTransactionStatusData(
                buildSellTransaction({ ...sellTrade, status: 'REFUNDED' }),
            ),
        ).toEqual({ icon: WarningIcon, intent: 'critical', messageId: 'TR_SELL_STATUS_ERROR' });
    });

    it('maps exchange statuses to the exchange status messages', () => {
        expect(
            getTradingTransactionStatusData(
                buildExchangeTransaction({ ...exchangeTrade, status: 'CONVERTING' }),
            ),
        ).toEqual({
            icon: SpinnerGapIcon,
            intent: 'warning',
            messageId: 'TR_EXCHANGE_STATUS_CONVERTING',
        });
        expect(
            getTradingTransactionStatusData(
                buildExchangeTransaction({ ...exchangeTrade, status: 'KYC' }),
            ),
        ).toEqual({ icon: WarningIcon, intent: 'warning', messageId: 'TR_EXCHANGE_STATUS_KYC' });
        expect(
            getTradingTransactionStatusData(
                buildExchangeTransaction({ ...exchangeTrade, status: 'SUCCESS' }),
            ),
        ).toEqual({ icon: CheckIcon, intent: 'brand', messageId: 'TR_EXCHANGE_STATUS_SUCCESS' });
    });
});
