import { TradingType } from '@suite-common/trading';
import { FiatRatesState } from '@suite-common/wallet-core';
import { Account, RatesByKey, type WalletSettings } from '@suite-common/wallet-types';
import { PROTO, StaticSessionId } from '@trezor/connect';

import { getBaseAccount, getBtcAccount, getEthAccount, getSolAccount } from './account';
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
}: GetWalletStateParams = {}) => {
    const accountOverrides = deviceState
        ? { deviceState: deviceState as StaticSessionId }
        : undefined;

    return {
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
            getBtcAccount('btc-account-1', accountOverrides),
            getBtcAccount('btc-account-2', accountOverrides),
            getEthAccount(undefined, accountOverrides),
            getBaseAccount(undefined, accountOverrides),
            getSolAccount(undefined, accountOverrides),
        ] as Account[],
        send: {
            drafts: {},
            precomposedTx: undefined,
            serializedTx: undefined,
            signedTx: undefined,
        },
    };
};
