import { type BuyTradeStatus, type ExchangeTradeStatus, type SellTradeStatus } from 'invity-api';

import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { selectDeviceTradesToWatchByAccount } from './tradesToWatchSelectors';

const DEVICE_STATIC_SESSION_ID = 'descriptor@deviceId:0' as StaticSessionId;
const OTHER_DEVICE_STATIC_SESSION_ID = 'descriptor@otherDeviceId:0' as StaticSessionId;
const UNKNOWN_ACCOUNT_KEY = 'unknown-btc-descriptor@deviceId:0' as AccountKey;

const selectedDevice = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});
const ethAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethDescriptor'),
    deviceState: DEVICE_STATIC_SESSION_ID,
});
const otherDeviceAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('otherDeviceBtcDescriptor'),
    deviceState: OTHER_DEVICE_STATIC_SESSION_ID,
});

type BuildBuyTradeParams = {
    key: string;
    status: BuyTradeStatus | undefined;
    accountKey: AccountKey | undefined;
};

const buildBuyTrade = ({
    key,
    status,
    accountKey,
}: BuildBuyTradeParams): TradingTransactionBuy => ({
    tradeType: 'buy',
    key,
    date: '2026-01-01T00:00:00Z',
    data: { status, paymentId: key },
    selectedAccountKey: accountKey,
    receiveAccountKey: accountKey,
});

type BuildSellTradeParams = {
    key: string;
    status: SellTradeStatus | undefined;
    accountKey: AccountKey | undefined;
};

const buildSellTrade = ({
    key,
    status,
    accountKey,
}: BuildSellTradeParams): TradingTransactionSell => ({
    tradeType: 'sell',
    key,
    date: '2026-01-01T00:00:00Z',
    data: { status, orderId: key },
    sendAccountKey: accountKey,
});

type BuildExchangeTradeParams = {
    key: string;
    status: ExchangeTradeStatus | undefined;
    accountKey: AccountKey | undefined;
};

const buildExchangeTrade = ({
    key,
    status,
    accountKey,
}: BuildExchangeTradeParams): TradingTransactionExchange => ({
    tradeType: 'exchange',
    key,
    date: '2026-01-01T00:00:00Z',
    data: { status, orderId: key },
    sendAccountKey: accountKey,
    receiveAccountKey: accountKey,
});

const buildState = (trades: TradingTransaction[]): TradingRootStateWithDeviceAndAccounts => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: {
        accounts: [btcAccount, ethAccount, otherDeviceAccount],
        selectedAccount: { status: 'none' },
        trading: { ...tradingInitialState, trades },
    },
});

describe('selectDeviceTradesToWatchByAccount', () => {
    it('groups non-final trades by the account each trade belongs to', () => {
        const btcBuy = buildBuyTrade({
            key: 'btc-buy',
            status: 'SUBMITTED',
            accountKey: btcAccount.key,
        });
        const btcSell = buildSellTrade({
            key: 'btc-sell',
            status: 'PENDING',
            accountKey: btcAccount.key,
        });
        const ethExchange = buildExchangeTrade({
            key: 'eth-exchange',
            status: 'CONVERTING',
            accountKey: ethAccount.key,
        });

        const result = selectDeviceTradesToWatchByAccount(
            buildState([btcBuy, ethExchange, btcSell]),
        );

        expect(result).toEqual([
            { account: btcAccount, trades: [btcBuy, btcSell] },
            { account: ethAccount, trades: [ethExchange] },
        ]);
    });

    it('skips trades in a final status and trades without a status', () => {
        const trades = [
            buildBuyTrade({ key: 'buy-success', status: 'SUCCESS', accountKey: btcAccount.key }),
            buildBuyTrade({ key: 'buy-blocked', status: 'BLOCKED', accountKey: btcAccount.key }),
            buildSellTrade({
                key: 'sell-refunded',
                status: 'REFUNDED',
                accountKey: btcAccount.key,
            }),
            buildExchangeTrade({ key: 'exchange-kyc', status: 'KYC', accountKey: ethAccount.key }),
            buildExchangeTrade({
                key: 'exchange-no-status',
                status: undefined,
                accountKey: ethAccount.key,
            }),
        ];

        expect(selectDeviceTradesToWatchByAccount(buildState(trades))).toEqual([]);
    });

    it('skips trades whose account does not belong to the selected device', () => {
        const trades = [
            buildBuyTrade({
                key: 'other-device-buy',
                status: 'SUBMITTED',
                accountKey: otherDeviceAccount.key,
            }),
            buildSellTrade({
                key: 'unknown-account-sell',
                status: 'PENDING',
                accountKey: UNKNOWN_ACCOUNT_KEY,
            }),
            buildExchangeTrade({
                key: 'no-account-exchange',
                status: 'CONFIRMING',
                accountKey: undefined,
            }),
        ];

        expect(selectDeviceTradesToWatchByAccount(buildState(trades))).toEqual([]);
    });

    it('returns the same empty array reference when there is nothing to watch', () => {
        const trade = buildBuyTrade({
            key: 'buy-success',
            status: 'SUCCESS',
            accountKey: btcAccount.key,
        });

        const first = selectDeviceTradesToWatchByAccount(buildState([trade]));
        const second = selectDeviceTradesToWatchByAccount(buildState([]));

        expect(first).toBe(second);
    });
});
