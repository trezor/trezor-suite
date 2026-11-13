import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    getAccountCryptoBalanceWithStaking,
    isSupportedStakingNetworkSymbol,
    selectAccountByKey,
    selectAssetAccounts,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectHiddenAssetAccountKeySet,
} from '@suite-common/wallet-core';
import { type AccountKey, type CryptoBaseCurrencyPair } from '@suite-common/wallet-types';
import { getFiatRateKey, isPositiveBalance, toFiatCurrency } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type HomeAssetTableState,
    type SmallBalanceSummary,
    getAssetStakingBalance,
    selectAreHomeAssetSmallBalancesDisplayed,
    selectSmallBalanceThreshold,
} from './homeAssetTableSelectors';
import { groupWalletAssets } from './homeAssetTableUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO = new BigNumber(0);

export type AccountAsset = {
    kind: 'coin' | 'token';
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    amount: string;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
    /** Undefined while nothing prices the asset. */
    fiatValue: BigNumber | undefined;
};

// The wallet's asset accounts are rebuilt whenever any account is written; a rebuild that lands on the
// same holdings for this account is thrown away, so another account's sync leaves these rows alone.
const haveSameAssetAccounts = (left: readonly AssetAccount[], right: readonly AssetAccount[]) =>
    left.length === right.length &&
    left.every(
        (assetAccount, index) =>
            assetAccount.assetAccountKey === right[index]?.assetAccountKey &&
            assetAccount.cryptoBalance === right[index]?.cryptoBalance &&
            assetAccount.tokenInfo === right[index]?.tokenInfo,
    );

/** The account's share of the wallet's assets, without the tokens the Home table hides. */
const selectShownAccountAssetAccounts = createMemoizedSelector(
    [
        selectAssetAccounts,
        selectHiddenAssetAccountKeySet,
        (_state: HomeAssetTableState, accountKey: AccountKey) => accountKey,
    ],
    (assetAccounts, hiddenKeys, accountKey): readonly AssetAccount[] =>
        returnStableArrayIfEmpty(
            assetAccounts.filter(
                assetAccount =>
                    assetAccount.accountKey === accountKey &&
                    !hiddenKeys.has(assetAccount.assetAccountKey),
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: haveSameAssetAccounts } },
);

const haveSameRates = (
    left: ReadonlyMap<CryptoBaseCurrencyPair, number>,
    right: ReadonlyMap<CryptoBaseCurrencyPair, number>,
) => left.size === right.size && [...left].every(([pair, rate]) => right.get(pair) === rate);

/**
 * The rate of each of the account's assets. The fiat state is rewritten on every fetch, so this
 * cheap pass hands the same map back while no number moved, and the rows are rebuilt only when one did.
 */
const selectAccountAssetRates = createMemoizedSelector(
    [selectShownAccountAssetAccounts, selectCurrentFiatRates, selectBaseCurrency],
    (assetAccounts, rates, baseCurrencyCode): ReadonlyMap<CryptoBaseCurrencyPair, number> => {
        const picked = new Map<CryptoBaseCurrencyPair, number>();

        assetAccounts.forEach(({ symbol, contractAddress }) => {
            const pair = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
            const rate = rates?.[pair]?.rate;

            if (rate !== undefined) {
                picked.set(pair, rate);
            }
        });

        return picked;
    },
    { memoizeOptions: { resultEqualityCheck: haveSameRates } },
);

const byFiatValue = (left: AccountAsset, right: AccountAsset) => {
    // What nothing can price goes below everything that can, even below what is worth zero.
    if ((left.fiatValue === undefined) !== (right.fiatValue === undefined)) {
        return left.fiatValue === undefined ? 1 : -1;
    }

    return (right.fiatValue ?? ZERO).comparedTo(left.fiatValue ?? ZERO) ?? 0;
};

/**
 * One account's assets, the most valuable first: its coin, its stake counted in as Home counts it,
 * and the tokens it shows.
 */
export const selectAccountAssets = createMemoizedSelector(
    [
        selectAccountByKey,
        selectShownAccountAssetAccounts,
        selectAccountAssetRates,
        selectBaseCurrency,
    ],
    (account, assetAccounts, rates, baseCurrencyCode): readonly AccountAsset[] => {
        if (account === null) {
            return returnStableArrayIfEmpty<AccountAsset>();
        }

        const assets = [...groupWalletAssets(assetAccounts).values()].map(
            ({ symbol, contractAddress, tokenSymbol, tokenDecimals, amount }) => {
                const rate = rates.get(getFiatRateKey(symbol, baseCurrencyCode, contractAddress));

                return {
                    kind: contractAddress === undefined ? 'coin' : 'token',
                    symbol,
                    contractAddress,
                    amount,
                    tokenSymbol,
                    tokenDecimals,
                    fiatValue:
                        rate === undefined
                            ? undefined
                            : (toFiatCurrency({ amount, rate }) ?? undefined),
                } satisfies AccountAsset;
            },
        );

        return assets.sort(byFiatValue);
    },
);

export type AccountEarnSplit = {
    symbol: NetworkSymbol;
    availableAmount: string;
    stakingAmount: string;
    /** The share of the coin that is staked, from 0 to 1. */
    stakingRatio: number;
};

/**
 * How much of the account's coin is staked and how much is not, as the asset detail's Earn card
 * splits the wallet's; undefined where the network cannot be staked here or the account holds none.
 */
export const selectAccountEarnSplit = createMemoizedSelector(
    [selectAccountByKey],
    (account): AccountEarnSplit | undefined => {
        if (account === null || !isSupportedStakingNetworkSymbol(account.symbol)) {
            return undefined;
        }

        const amount = getAccountCryptoBalanceWithStaking(account);

        if (!isPositiveBalance(amount)) {
            return undefined;
        }

        const stakingAmount = getAssetStakingBalance(account) ?? '0';

        return {
            symbol: account.symbol,
            availableAmount: new BigNumber(amount).minus(stakingAmount).toFixed(),
            stakingAmount,
            stakingRatio: isPositiveBalance(stakingAmount)
                ? Number(stakingAmount) / Number(amount)
                : 0,
        };
    },
);

/**
 * The account's tokens worth under the small-balance line; none until the USD rate is known. The
 * coin is what the page is about, so it is never small.
 */
const selectSmallAccountAssets = createMemoizedSelector(
    [selectAccountAssets, selectSmallBalanceThreshold],
    (assets, threshold): readonly AccountAsset[] =>
        returnStableArrayIfEmpty(
            threshold === undefined
                ? []
                : assets.filter(
                      ({ kind, fiatValue }) =>
                          kind === 'token' && fiatValue?.lt(threshold) === true,
                  ),
        ),
);

export const selectAccountSmallBalanceSummary = createMemoizedSelector(
    [selectSmallAccountAssets],
    (small): SmallBalanceSummary | undefined =>
        small.length === 0
            ? undefined
            : {
                  assetCount: small.length,
                  fiatValue: small.reduce(
                      (total, { fiatValue }) => total.plus(fiatValue ?? ZERO),
                      ZERO,
                  ),
              },
);

/** The rows the account's table draws: every asset, or all but the small ones while those are switched off. */
export const selectDisplayedAccountAssets = createMemoizedSelector(
    [selectAccountAssets, selectSmallAccountAssets, selectAreHomeAssetSmallBalancesDisplayed],
    (assets, small, areSmallBalancesShown): readonly AccountAsset[] =>
        areSmallBalancesShown || small.length === 0
            ? assets
            : returnStableArrayIfEmpty(assets.filter(asset => !small.includes(asset))),
);
