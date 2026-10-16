import { type TradingType } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type SendState } from '@suite-common/wallet-core';
import { mockFiatRatesApiState } from '@suite-common/wallet-core/mocks';
import {
    type Account,
    type WalletSettings,
    asAccountDescriptor,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { type StaticSessionId } from '@trezor/device-utils';

import { getBaseAccount, getBtcAccount, getEthAccount, getSolAccount } from './account';
import { btc1NormalAccount, eth1NormalAccount, eth2legacyAccount } from './accounts';
import { createMockRate } from './fiat';
import { createPrecomposedLevels } from './precomposedTransaction';
import { getInitializedTradingState } from './tradingState';

const ethSymbol = asNetworkSymbol('eth');
const usdcContract = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

/**
 * Current fiat rates matching the accounts of `getWalletState`, as the `fiatRatesApi` root state.
 */
export const getFiatRatesApiState = () =>
    mockFiatRatesApiState({
        current: {
            [getFiatRateKey(ethSymbol, 'usd')]: createMockRate(1000, ethSymbol),
            [getFiatRateKey(asNetworkSymbol('btc'), 'usd')]: createMockRate(
                0.001,
                asNetworkSymbol('btc'),
            ),
            [getFiatRateKey(asNetworkSymbol('sol'), 'usd')]: createMockRate(
                150,
                asNetworkSymbol('sol'),
            ),
            [getFiatRateKey(ethSymbol, 'usd', usdcContract)]: {
                ...createMockRate(0.99, ethSymbol),
                ticker: { symbol: ethSymbol, tokenAddress: usdcContract },
            },
        },
    });

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
        fiat: { historic: {} },
        accounts: [
            getBtcAccount({ ...accountOverrides, descriptor: asAccountDescriptor('btc1normal') }),
            getBtcAccount({ ...accountOverrides, descriptor: asAccountDescriptor('btc2legacy') }),
            getEthAccount(accountOverrides),
            getBaseAccount(accountOverrides),
            getSolAccount(accountOverrides),
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
