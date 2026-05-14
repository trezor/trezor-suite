import { type TradingType } from '@suite-common/trading';
import { type FiatRatesState, type SendState } from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type RatesByKey,
    type WalletSettings,
} from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { PROTO } from '@trezor/connect';

import { getBaseAccount, getBtcAccount, getEthAccount, getSolAccount } from './account';
import { btc1NormalAccount, eth1NormalAccount, eth2legacyAccount } from './accounts';
import { createPrecomposedLevels } from './precomposedTransaction';
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
                // ETH - USD
                'eth-usd': {
                    rate: 1000,
                },
                // BTC - USD
                'btc-usd': {
                    rate: 0.001,
                },
                // SOL - USD
                'sol-usd': {
                    rate: 150,
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
            getBtcAccount('btc-account-1' as AccountKey, accountOverrides),
            getBtcAccount('btc-account-2' as AccountKey, accountOverrides),
            getEthAccount(undefined, accountOverrides),
            getBaseAccount(undefined, accountOverrides),
            getSolAccount(undefined, accountOverrides),
            btc1NormalAccount,
            eth1NormalAccount,
            eth2legacyAccount,
        ] as Account[],
        send: {
            drafts: {},
            precomposedTx: undefined,
            serializedTx: undefined,
            signedTx: undefined,
            feeLevels: createPrecomposedLevels({
                normal: {
                    fee: '433210428000',
                    feePerByte: '1',
                    feeLimit: '11000',
                    estimatedFeeLimit: '11000',
                },
                high: {
                    fee: '733210428000',
                    feePerByte: '4',
                    feeLimit: '21000',
                    estimatedFeeLimit: '21000',
                },
                custom: {
                    totalSpent: '1000426691398000',
                    fee: '426691398000',
                    feePerByte: '2',
                    feeLimit: '31000',
                    estimatedFeeLimit: '31000',
                },
            }),
        } as SendState,
    };
};
