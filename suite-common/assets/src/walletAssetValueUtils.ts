import { formatStakingAmount } from '@suite-common/earn-staking';
import {
    type StakingPosition,
    getStakingPositionAmount,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type CryptoBaseCurrencyPair, type Rate } from '@suite-common/wallet-types';
import { getFiatRateKey, isPositiveBalance, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { type WalletAsset } from './homeAssetTableUtils';

const ZERO = new BigNumber(0);

/**
 * The rate of each asset, as a plain number. The fiat state is rewritten on every fetch — a batch of
 * a few tickers, a loading flag flipped — so whatever reads it reruns often. This pass is the cheap
 * one: a key and a lookup per asset, and the same map handed back when no number moved, so the
 * arithmetic behind it runs only when a price does.
 */
const pickRatesBy =
    <Entry>(pickRate: (entry: Entry) => number | undefined) =>
    (
        assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
        rates: Record<CryptoBaseCurrencyPair, Entry> | undefined,
        baseCurrencyCode: BaseCurrencyCode,
    ): ReadonlyMap<WalletAssetKey, number> => {
        const picked = new Map<WalletAssetKey, number>();

        assets.forEach(({ assetKey, networkSymbol, contractAddress }) => {
            const entry = rates?.[getFiatRateKey(networkSymbol, baseCurrencyCode, contractAddress)];
            const rate = entry && pickRate(entry);

            if (rate !== undefined) {
                picked.set(assetKey, rate);
            }
        });

        return picked;
    };

const haveSameRates = (
    left: ReadonlyMap<WalletAssetKey, number>,
    right: ReadonlyMap<WalletAssetKey, number>,
) =>
    left.size === right.size && [...left].every(([assetKey, rate]) => right.get(assetKey) === rate);

export const ratesResultEquality = { memoizeOptions: { resultEqualityCheck: haveSameRates } };

export const pickRates = pickRatesBy((entry: Rate) => entry.rate);

/** What each asset is worth: the one pass with arithmetic in it, run only when a rate or a balance moved. */
export const priceAssets = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    rates: ReadonlyMap<WalletAssetKey, number>,
): ReadonlyMap<WalletAssetKey, BigNumber> => {
    const priced = new Map<WalletAssetKey, BigNumber>();

    rates.forEach((rate, assetKey) => {
        const amount = assets.get(assetKey)?.amount;
        const fiatValue = amount === undefined ? null : toFiatCurrency({ amount, rate });

        if (fiatValue !== null) {
            priced.set(assetKey, fiatValue);
        }
    });

    return priced;
};

const haveSameFiatValues = (
    left: ReadonlyMap<WalletAssetKey, BigNumber>,
    right: ReadonlyMap<WalletAssetKey, BigNumber>,
) =>
    left.size === right.size &&
    [...left].every(([assetKey, fiatValue]) => right.get(assetKey)?.eq(fiatValue));

export const fiatValuesResultEquality = {
    memoizeOptions: { resultEqualityCheck: haveSameFiatValues },
};

export const byValue =
    (values: ReadonlyMap<WalletAssetKey, BigNumber>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        // What nothing can price goes below everything that can, even below what is worth zero.
        const isPriced = (assetKey: WalletAssetKey) => values.has(assetKey);

        if (isPriced(left) !== isPriced(right)) {
            return isPriced(left) ? -1 : 1;
        }

        const worth = (assetKey: WalletAssetKey) => values.get(assetKey) ?? ZERO;

        // `comparedTo` is typed to answer null for a NaN side, which `toFiatCurrency` rules out.
        return worth(right).comparedTo(worth(left)) ?? 0;
    };

const byCryptoBalance =
    (assets: ReadonlyMap<WalletAssetKey, WalletAsset>) =>
    (left: WalletAssetKey, right: WalletAssetKey) => {
        const balance = (assetKey: WalletAssetKey) => assets.get(assetKey)?.cryptoBalance ?? ZERO;

        return balance(right).comparedTo(balance(left)) ?? 0;
    };

export const byFiatThenCryptoBalance = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    values: ReadonlyMap<WalletAssetKey, BigNumber>,
) => {
    const byFiat = byValue(values);
    const byCrypto = byCryptoBalance(assets);

    return (left: WalletAssetKey, right: WalletAssetKey) =>
        byFiat(left, right) || byCrypto(left, right);
};

export type SmallBalanceSummary = {
    assetCount: number;
    fiatValue: BigNumber;
};

const haveSameSmallBalanceSummary = (
    left: SmallBalanceSummary | undefined,
    right: SmallBalanceSummary | undefined,
) => {
    if (left === undefined || right === undefined) {
        return left === right;
    }

    return left.assetCount === right.assetCount && left.fiatValue.eq(right.fiatValue);
};

export const smallBalanceSummaryResultEquality = {
    memoizeOptions: { resultEqualityCheck: haveSameSmallBalanceSummary },
};

export const summarizeSmallBalances = (
    fiatValues: readonly BigNumber[],
): SmallBalanceSummary | undefined =>
    fiatValues.length === 0
        ? undefined
        : {
              assetCount: fiatValues.length,
              fiatValue: fiatValues.reduce((total, value) => total.plus(value), ZERO),
          };

export const sumStakingPositionAmounts = (entries: readonly { position: StakingPosition }[]) =>
    entries.reduce((total, { position }) => total.plus(getStakingPositionAmount(position)), ZERO);

export const formatStakingTotal = (total: BigNumber, networkSymbol: NetworkSymbol) =>
    formatStakingAmount({
        amount: stakingAmountSchema.parse(total.toFixed(0)),
        networkSymbol,
    });

export const getStakingRatio = (amount: string, stakingAmount: string) =>
    isPositiveBalance(amount) && isPositiveBalance(stakingAmount)
        ? Number(stakingAmount) / Number(amount)
        : undefined;
