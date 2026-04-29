import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
    ChainAddressKey,
    type MerkleRewardsByChainAndAddress,
    useGetMerkleRewards,
} from '@suite-common/earn-stablecoin-api';
import { commonQueryKeys } from '@suite-common/react-query';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkByEvmChainId,
} from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
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
import { BigNumber, unique } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

export type MerkleRewardWithFiat =
    MerkleRewardsByChainAndAddress[keyof MerkleRewardsByChainAndAddress][number] & {
        claimable: string;
        fiat: {
            amount: BaseCurrencyAmount | null;
            claimed: BaseCurrencyAmount | null;
            pending: BaseCurrencyAmount | null;
            claimable: BaseCurrencyAmount | null;
        };
    };

export type MerkleRewardsWithFiatRecord = Record<
    keyof MerkleRewardsByChainAndAddress,
    MerkleRewardWithFiat[]
>;

export type MerkleRewardsSource = {
    networkSymbol: NetworkSymbol;
    address: string;
};

function getMerkleRewardsQueryEntries(sources: MerkleRewardsSource[]) {
    const candidatesForMerkleRewards = sources.flatMap(source => {
        const network = getNetwork(source.networkSymbol);

        if (!network?.chainId) {
            return [];
        }

        return [ChainAddressKey.compose(network.chainId, source.address)];
    });

    return unique(candidatesForMerkleRewards).map(candidate => {
        const { chainId, address } = ChainAddressKey.parse(candidate);

        return { chainId: Number(chainId), address };
    });
}

function extendMerkleRewardsWithFiat(
    rewardsByChainAndAddress: MerkleRewardsByChainAndAddress = {},
    baseCurrency: BaseCurrencyCode,
    currentFiatRates: RatesByKey | undefined,
) {
    const toFiatFromSubunits = (
        valueInSubunits: string | null,
        decimals: number,
        rate: number | undefined,
    ) => {
        if (valueInSubunits === null || rate === undefined) {
            return null;
        }

        return toFiatCurrency({
            amount: subunitsToUnits({
                value: asAmountSubunit(new BigNumber(valueInSubunits)),
                decimals,
            }),
            rate,
        });
    };

    const missingRateTickers: TickerId[] = [];
    const rewardsWithFiat = Object.fromEntries(
        Object.entries(rewardsByChainAndAddress).map(([key, rewards]) => {
            const { chainId } = ChainAddressKey.parse(key);
            const network = getNetworkByEvmChainId(chainId);

            const rewardsWithFiat = rewards.map(reward => {
                const claimable = new BigNumber(reward.amount)
                    .minus(reward.claimed)
                    .minus(reward.pending)
                    .toFixed();

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
                        amount: toFiatFromSubunits(reward.amount, reward.token.decimals, rate),
                        claimed: toFiatFromSubunits(reward.claimed, reward.token.decimals, rate),
                        pending: toFiatFromSubunits(reward.pending, reward.token.decimals, rate),
                        claimable: toFiatFromSubunits(claimable, reward.token.decimals, rate),
                    },
                };
            });

            return [key, rewardsWithFiat] as const;
        }),
    );

    return {
        rewardsWithFiat,
        missingRateTickers,
    };
}

/**
 * - Fetches Merkle rewards from provided chain/address query entries.
 * - Extends Merkle rewards with fiat rates (and fetches missing rate tickers).
 */
export function useMerkleRewards(sources: MerkleRewardsSource[]) {
    const dispatch = useDispatch();
    const merkleRewardsQueryEntries = useMemo(
        () => getMerkleRewardsQueryEntries(sources),
        [sources],
    );

    const baseCurrency = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const merkleRewardsQuery = useGetMerkleRewards(merkleRewardsQueryEntries);

    const { rewardsWithFiat, missingRateTickers } = useMemo(
        () => extendMerkleRewardsWithFiat(merkleRewardsQuery.data, baseCurrency, currentFiatRates),
        [baseCurrency, currentFiatRates, merkleRewardsQuery.data],
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

        return new BigNumber(result.toFixed(2));
    }, [rewardsWithFiat]);

    return {
        merkleRewardsQuery: {
            ...merkleRewardsQuery,
            data: {
                rewards: rewardsWithFiat,
                totalRewardsToClaim: {
                    value: asBaseCurrencyAmount(totalRewardsToClaim),
                    currency: baseCurrency,
                },
            },
        },
        missingRateTickersQuery,
    };
}
