import { useCallback, useMemo } from 'react';

import {
    ChainAddressKey,
    type MerkleRewardsByChainAndAddress,
    getMerkleRewards,
    useGetMerkleRewards,
} from '@suite-common/earn-stablecoin-api';
import { commonQueryKeys, useQuery, useQueryClient } from '@suite-common/react-query';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    type RatesByKey,
    type TickerId,
    type Timestamp,
    asBaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getContractAddressForNetworkSymbol,
    getFiatRateKey,
    getTickerFromFiatRateKey,
    subunitsToUnits,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { useFreshRef } from '@trezor/react-utils';
import { BigNumber, delay } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useMerkleRewardsQueryEntries } from './useMerkleRewardsQueryEntries';

export type MerkleRewardWithFiat =
    MerkleRewardsByChainAndAddress[keyof MerkleRewardsByChainAndAddress][number] & {
        claimable: BaseCurrencyAmount;
        fiat: {
            amount: BaseCurrencyAmount | null;
            claimed: BaseCurrencyAmount | null;
            pending: BaseCurrencyAmount | null;
            claimable: BaseCurrencyAmount | null;
        };
    };

export type MerkleRewardsWithFiatRecord = Record<string, MerkleRewardWithFiat[]>;

function extendMerkleRewardsWithFiat(
    rewardsByChainAndAddress: MerkleRewardsByChainAndAddress = {},
    baseCurrency: BaseCurrencyCode,
    currentFiatRates: RatesByKey | undefined,
) {
    const toFiatFromSubunits = (
        valueInSubunits: BigNumber | string | null,
        decimals: number,
        rate: number | undefined,
    ) => {
        if (valueInSubunits === null || rate === undefined) {
            return null;
        }

        return toFiatCurrency({
            amount: subunitsToUnits({
                value: asAmountSubunit(
                    typeof valueInSubunits === 'string'
                        ? new BigNumber(valueInSubunits)
                        : valueInSubunits,
                ),
                decimals,
            }),
            rate,
        });
    };

    const missingRateTickers: TickerId[] = [];
    const rewardsWithFiat = Object.fromEntries(
        Object.entries(rewardsByChainAndAddress)
            .map(([key, rewards]) => {
                const { chainId } = ChainAddressKey.parse(key);
                const network = getNetworkByEvmChainId(chainId);

                const rewardsWithFiat = rewards
                    .map(reward => {
                        const claimableBN = new BigNumber(reward.amount)
                            .minus(reward.claimed)
                            .minus(reward.pending);

                        if (!claimableBN.gt(0)) {
                            return null;
                        }

                        const claimable = asBaseCurrencyAmount(claimableBN);

                        if (!network) {
                            return {
                                ...reward,
                                claimable,
                                fiat: {
                                    amount: null,
                                    claimed: null,
                                    pending: null,
                                    claimable: null,
                                },
                            };
                        }

                        const tokenAddress = getContractAddressForNetworkSymbol(
                            network.symbol,
                            reward.token.address,
                        );
                        const fiatRateKey = getFiatRateKey(
                            network.symbol,
                            baseCurrency,
                            toTokenAddress(tokenAddress),
                        );
                        const rate = currentFiatRates?.[fiatRateKey]?.rate;
                        const ticker = getTickerFromFiatRateKey(fiatRateKey);

                        if (rate === undefined && ticker) {
                            missingRateTickers.push(ticker);
                        }

                        return {
                            ...reward,
                            claimable,
                            fiat: {
                                amount: toFiatFromSubunits(
                                    reward.amount,
                                    reward.token.decimals,
                                    rate,
                                ),
                                claimed: toFiatFromSubunits(
                                    reward.claimed,
                                    reward.token.decimals,
                                    rate,
                                ),
                                pending: toFiatFromSubunits(
                                    reward.pending,
                                    reward.token.decimals,
                                    rate,
                                ),
                                claimable: toFiatFromSubunits(
                                    claimable,
                                    reward.token.decimals,
                                    rate,
                                ),
                            },
                        };
                    })
                    .filter((reward): reward is NonNullable<typeof reward> => Boolean(reward));

                return [key, rewardsWithFiat] as const;
            })
            .filter(([, rewards]) => rewards.length > 0),
    );

    return {
        rewardsWithFiat,
        missingRateTickers,
    };
}

export type YieldRewardsAccounts = (Account | undefined) | (Account | undefined)[];

/**
 * - Fetches Merkle rewards from provided chain/address query entries.
 * - Extends Merkle rewards with fiat rates (and fetches missing rate tickers).
 */
export function useMerkleRewards(accounts: YieldRewardsAccounts) {
    const dispatch = useDispatch();

    const resolvedAccounts = useMemo<Account[]>(() => {
        const maybeAccounts = Array.isArray(accounts) ? accounts : [accounts];

        return maybeAccounts.filter((account): account is Account => Boolean(account));
    }, [accounts]);
    const merkleRewardsQueryEntries = useMerkleRewardsQueryEntries(resolvedAccounts);
    const merkleRewardsQuery = useGetMerkleRewards(merkleRewardsQueryEntries);
    const queryClient = useQueryClient();

    const baseCurrency = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const { rewardsWithFiat, missingRateTickers } = useMemo(
        () => extendMerkleRewardsWithFiat(merkleRewardsQuery.data, baseCurrency, currentFiatRates),
        [baseCurrency, currentFiatRates, merkleRewardsQuery.data],
    );

    const accountsRewards = useMemo(
        () =>
            Object.entries(rewardsWithFiat)
                .map(([key, rewards]) => {
                    const { chainId, address } = ChainAddressKey.parse(key);
                    const totalClaimableFiatAmount = rewards.reduce(
                        (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
                        new BigNumber(0),
                    );

                    const network = getNetworkByEvmChainId(chainId);
                    const rewardAccount = resolvedAccounts.find(
                        account =>
                            account.networkType === 'ethereum' &&
                            account.symbol === network?.symbol &&
                            account.descriptor.toLowerCase() === address.toLowerCase(),
                    );

                    if (!rewardAccount) {
                        return null;
                    }

                    return {
                        account: rewardAccount,
                        rewards,
                        totalClaimableFiatAmount: asBaseCurrencyAmount(totalClaimableFiatAmount),
                    };
                })
                .filter(
                    (account): account is NonNullable<typeof account> =>
                        !!account && account.totalClaimableFiatAmount.gt(0),
                ),
        [rewardsWithFiat, resolvedAccounts],
    );

    const missingRateTickersQuery = useQuery({
        queryKey: commonQueryKeys.missingRateTickers(missingRateTickers, baseCurrency),
        queryFn: () =>
            dispatch(
                updateFiatRatesThunk({
                    tickers: missingRateTickers,
                    baseCurrencyCode: baseCurrency,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                    forceFetchToken: true,
                }),
            ).unwrap(),
        enabled: missingRateTickers.length > 0,
    });

    const totalRewardsToClaim = useMemo(() => {
        const result = Object.values(rewardsWithFiat).reduce(
            (result, rewards) =>
                result.plus(
                    rewards.reduce(
                        (acc, reward) => acc.plus(reward.fiat.claimable ?? '0'),
                        new BigNumber(0),
                    ),
                ),
            new BigNumber(0),
        );

        return asBaseCurrencyAmount(new BigNumber(result.toFixed(2)));
    }, [rewardsWithFiat]);

    const accountsRewardsRef = useFreshRef(accountsRewards);
    const merkleRewardsQueryEntriesRef = useFreshRef(merkleRewardsQueryEntries);
    /**
     * - Force Merkle to return fresh rewards after claiming has completed and the tx is confirmed on-chain.
     * - It resolves once Merkle return empty rewards = actually finished processing the claim.
     */
    const waitForMerkleToResolveClaim = useCallback(async () => {
        let attempts = 30;

        await queryClient.invalidateQueries({
            queryKey: commonQueryKeys.merkleRewards(merkleRewardsQueryEntriesRef.current),
            type: 'inactive',
        });

        const abortController = new AbortController();
        const { signal } = abortController;

        // Refetch until it returns no rewards (i.e. the claim was finalized by Merkle)
        while (accountsRewardsRef.current.length > 0 && attempts > 0 && !signal.aborted) {
            // Do direct API calls to avoid manipulating with React Query cache (because once the the endpoint returns empty rewards, the component would rerender with empty rewards state instead of successfull one)
            const rewards = await getMerkleRewards({
                queryEntries: merkleRewardsQueryEntriesRef.current,
            });

            if (Object.keys(rewards).length === 0) {
                break;
            }

            await delay(2000, signal);
            attempts--;
        }

        await queryClient.invalidateQueries({
            queryKey: commonQueryKeys.merkleRewards(merkleRewardsQueryEntriesRef.current),
            type: 'inactive',
        });

        return () => {
            if (attempts > 0 && !signal.aborted) {
                abortController.abort();
            }
        };
    }, [accountsRewardsRef, merkleRewardsQueryEntriesRef, queryClient]);

    return {
        merkleRewardsQuery: {
            ...merkleRewardsQuery,
            waitForMerkleToResolveClaim,
            data: {
                accountsRewards,
                totalRewardsToClaim: {
                    value: totalRewardsToClaim,
                    currency: baseCurrency,
                },
            },
        },
        missingRateTickersQuery,
    };
}

export type YieldAccountsRewards = NonNullable<
    ReturnType<typeof useMerkleRewards>['merkleRewardsQuery']['data']['accountsRewards']
>;

export type YieldAccountRewards = YieldAccountsRewards[number];
