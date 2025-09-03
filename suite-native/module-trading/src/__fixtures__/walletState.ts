import { TradingType } from '@suite-common/trading';
import { FiatRatesState } from '@suite-common/wallet-core';
import { Account, RatesByKey, type WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { getBaseAccount, getBtcAccount, getEthAccount } from './account';
import { getInitializedTradingState } from './tradingState';

type GetWalletStateParams = {
    bitcoinAmountUnit?: PROTO.AmountUnit;
    tradeType?: TradingType;
    deviceState?: string;
};

export const getWalletState = ({
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    tradeType = 'buy',
    deviceState,
}: GetWalletStateParams = {}) => ({
    trading: getInitializedTradingState(tradeType),
    settings: {
        localCurrency: 'usd',
        bitcoinAmountUnit,
    } as WalletSettings,
    fiat: {
        current: {
            // BTC - USD
            'btc-usd': {
                rate: 0.001,
            },
            // USDC - USD
            'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-usd': {
                rate: 0.99,
            },
        } as RatesByKey,
        historic: {},
        lastWeek: {},
    } as FiatRatesState,
    accounts: [
        { ...getBtcAccount('btc-account-1'), ...(deviceState && { deviceState }) },
        { ...getBtcAccount('btc-account-2'), ...(deviceState && { deviceState }) },
        { ...getEthAccount(), ...(deviceState && { deviceState }) },
        { ...getBaseAccount(), ...(deviceState && { deviceState }) },
    ] as Account[],
});
