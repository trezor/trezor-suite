import {
    formatStakingAmount,
    selectCountedStakingPositionEntriesByAccount,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isSupportedStakingNetworkSymbol,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsTokenFiatRateDisallowed,
} from '@suite-common/wallet-core';
import { type AccountKey, type CryptoBaseCurrencyPair } from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    isPositiveBalance,
    isTestnet,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type AssetAccount,
    selectAssetAccounts,
    selectHiddenAssetAccountKeySet,
} from './assetAccountsSelectors';
import {
    type HomeAssetTableState,
    type SmallBalanceSummary,
    selectAreHomeAssetSmallBalancesDisplayed,
    selectSmallBalanceThreshold,
} from './homeAssetTableSelectors';
import { groupWalletAssets } from './homeAssetTableUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO = new BigNumber(0);

export type AccountAsset = {
    kind: 'coin' | 'token';
    networkSymbol: NetworkSymbol;
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

        assetAccounts.forEach(({ networkSymbol, contractAddress }) => {
            const pair = getFiatRateKey(networkSymbol, baseCurrencyCode, contractAddress);
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
            ({ networkSymbol, contractAddress, tokenSymbol, tokenDecimals, amount }) => {
                const rate = rates.get(
                    getFiatRateKey(networkSymbol, baseCurrencyCode, contractAddress),
                );

                return {
                    kind: contractAddress === undefined ? 'coin' : 'token',
                    networkSymbol,
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

const haveSameFiatValue = (left: BigNumber | undefined, right: BigNumber | undefined) =>
    left === undefined || right === undefined ? left === right : left.eq(right);

/** What the account's priced assets are worth together; undefined while none of them is priced. */
export const selectAccountFiatValue = createMemoizedSelector(
    [selectAccountAssets],
    (assets): BigNumber | undefined => {
        const fiatValues = assets.flatMap(({ fiatValue }) => fiatValue ?? []);

        return fiatValues.length === 0
            ? undefined
            : fiatValues.reduce((total, value) => total.plus(value), ZERO);
    },
    { memoizeOptions: { resultEqualityCheck: haveSameFiatValue } },
);

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAccountAssetRatePending = (
    state: HomeAssetTableState,
    { networkSymbol, contractAddress }: AccountAsset,
) =>
    !isTestnet(networkSymbol) &&
    !selectIsTokenFiatRateDisallowed(state, networkSymbol, contractAddress) &&
    !selectCurrentFiatRates(state)?.[
        getFiatRateKey(networkSymbol, selectBaseCurrency(state), contractAddress)
    ]?.error;

/** Whether a rate the account still lacks is on its way, so its total is worth waiting for. */
export const selectIsAccountFiatRatePending = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) =>
    selectAccountAssets(state, accountKey).some(
        asset => asset.fiatValue === undefined && isAccountAssetRatePending(state, asset),
    );

/**
 * Whether the account's total leaves out an asset it holds that has no rate to come. One still on
 * its way is not counted: the total is only short of it until it lands.
 */
export const selectIsAccountFiatTotalIncomplete = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) => {
    const assets = selectAccountAssets(state, accountKey);

    return (
        assets.some(({ fiatValue }) => fiatValue !== undefined) &&
        assets.some(
            asset =>
                asset.fiatValue === undefined &&
                // An empty asset adds nothing whatever its rate.
                isPositiveBalance(asset.amount) &&
                !isAccountAssetRatePending(state, asset),
        )
    );
};

export type AccountEarnSplit = {
    networkSymbol: NetworkSymbol;
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
    [
        selectAccountByKey,
        selectShownAccountAssetAccounts,
        selectCountedStakingPositionEntriesByAccount,
    ],
    (account, assetAccounts, stakingEntries): AccountEarnSplit | undefined => {
        if (account === null || !isSupportedStakingNetworkSymbol(account.symbol)) {
            return undefined;
        }

        // The coin's amount counts its stake in, as the Home asset table's does.
        const amount =
            assetAccounts.find(({ contractAddress }) => contractAddress === undefined)
                ?.cryptoBalance ?? '0';

        if (!isPositiveBalance(amount)) {
            return undefined;
        }

        const stakingAmount = formatStakingAmount({
            amount: stakingAmountSchema.parse(
                stakingEntries
                    .reduce(
                        (total, { position }) => total.plus(getStakingPositionAmount(position)),
                        ZERO,
                    )
                    .toFixed(0),
            ),
            networkSymbol: account.symbol,
        });

        return {
            networkSymbol: account.symbol,
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
