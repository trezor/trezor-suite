import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
    ChainAddressKey,
    type MerkleRewardsByChainAndAddress,
    useGetMerkleRewards,
} from '@suite-common/earn-stablecoin-api';
import { commonQueryKeys } from '@suite-common/react-query';
import { getNetwork, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
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

import { type YieldAccountOpportunity } from '../types';

function getMerkleRewardsQueryEntries(yieldAccountOpportunities: YieldAccountOpportunity[]) {
    const candidatesForMerkleRewards = yieldAccountOpportunities
        .filter(
            opportunity =>
                opportunity.hasVaultPosition &&
                opportunity.account &&
                getNetwork(opportunity.networkSymbol),
        )
        .map(opportunity =>
            ChainAddressKey.compose(
                getNetwork(opportunity.networkSymbol)?.chainId as number,
                opportunity.account?.descriptor as string,
            ),
        );

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
                if (!network) {
                    return {
                        ...reward,
                        amountFiat: null,
                        claimedFiat: null,
                        pendingFiat: null,
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

                const amountFiat = toFiatFromSubunits(reward.amount, reward.token.decimals, rate);
                const claimedFiat = toFiatFromSubunits(reward.claimed, reward.token.decimals, rate);
                const pendingFiat = toFiatFromSubunits(reward.pending, reward.token.decimals, rate);

                return {
                    ...reward,
                    amountFiat,
                    claimedFiat,
                    pendingFiat,
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
 * - Fetches Merkle rewards from provided `YieldAccountOpportunity`.
 * - Extends Merkle rewards with fiat rates (and fetches missing rate tickers).
 */
export function useMerkleRewards(yieldAccountOpportunities: YieldAccountOpportunity[]) {
    const dispatch = useDispatch();
    const merkleRewardsQueryEntries = useMemo(
        () => getMerkleRewardsQueryEntries(yieldAccountOpportunities),
        [yieldAccountOpportunities],
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
                        (acc, reward) => acc.plus(reward.amountFiat ?? '0'),
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
