import { TradingType } from '@suite-common/trading';
import { FiatRatesState } from '@suite-common/wallet-core';
import { Account, RatesByKey, type WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { getBtcAccount, getEthAccount } from './account';
import { getInitializedTradingState } from './tradingState';

type GetWalletStateParams = {
    bitcoinAmountUnit?: PROTO.AmountUnit;
    tradeType?: TradingType;
};

export const getWalletState = ({
    bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN,
    tradeType = 'buy',
}: GetWalletStateParams = {}) => ({
    tradingNew: getInitializedTradingState(tradeType),
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
    accounts: [getBtcAccount(), getEthAccount()] as Account[],
    selectedAccount: { status: 'none' as const },
});
