import type { CryptoId } from 'invity-api';

import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { getCryptoId } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export type TradeableAssetBalance = {
    cryptoAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
};

export type TradeableAssetBalances = ReadonlyMap<CryptoId, TradeableAssetBalance>;

type TradeableAssetBalancesRootState = AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

type AggregatedCryptoAmount = {
    amount: BigNumber;
    symbol: Parameters<typeof getFiatRateKey>[0];
    contractAddress?: TokenAddress;
};

const createTradeableAssetBalancesSelector =
    createWeakMapSelector.withTypes<TradeableAssetBalancesRootState>();

export const selectTradeableAssetBalances = createTradeableAssetBalancesSelector(
    [selectVisibleDeviceAccounts, selectCurrentFiatRates, selectBaseCurrency],
    (accounts, fiatRates, baseCurrency) => {
        const amountsByCryptoId = new Map<CryptoId, AggregatedCryptoAmount>();

        const addAmount = (
            cryptoId: CryptoId,
            amount: string,
            symbol: AggregatedCryptoAmount['symbol'],
            contractAddress?: TokenAddress,
        ) => {
            const parsedAmount = new BigNumber(amount);
            if (!parsedAmount.isFinite() || !parsedAmount.gt(0)) {
                return;
            }

            const aggregatedAmount = amountsByCryptoId.get(cryptoId);
            if (aggregatedAmount) {
                aggregatedAmount.amount = aggregatedAmount.amount.plus(parsedAmount);

                return;
            }

            amountsByCryptoId.set(cryptoId, {
                amount: parsedAmount,
                symbol,
                contractAddress,
            });
        };

        accounts.forEach(account => {
            const { tradeCryptoId } = getNetwork(account.symbol);
            if (!tradeCryptoId) {
                return;
            }

            addAmount(getCryptoId(account.symbol), account.formattedBalance, account.symbol);

            account.tokens?.forEach(token => {
                if (!token.contract || !token.balance) {
                    return;
                }

                const cryptoId = getCryptoId(account.symbol, token.contract);

                addAmount(cryptoId, token.balance, account.symbol, token.contract as TokenAddress);
            });
        });

        const balances = new Map<CryptoId, TradeableAssetBalance>();

        amountsByCryptoId.forEach((aggregatedAmount, cryptoId) => {
            const fiatRateKey = getFiatRateKey(
                aggregatedAmount.symbol,
                baseCurrency,
                aggregatedAmount.contractAddress,
            );

            const rate = fiatRates?.[fiatRateKey]?.rate;

            const cryptoAmount = aggregatedAmount.amount.toFixed();

            balances.set(cryptoId, {
                cryptoAmount,
                fiatAmount: toFiatCurrency({ amount: cryptoAmount, rate }),
            });
        });

        return balances;
    },
);
