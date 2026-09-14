import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type NetworkConfigDeps, selectNetworkConfigDeps } from '@suite-common/networks';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    type RatesByKey,
    type TickerId,
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
import { BigNumber } from '@trezor/utils';

import { type MerklChainsRewards } from './useGetMerklRewards';

function extendMerklRewardsWithFiat(
    networkConfigDeps: NetworkConfigDeps,
    chainsRewards: MerklChainsRewards = [],
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
            amount: subunitsToUnits(networkConfigDeps, {
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
    const chainsRewardsWithFiat = chainsRewards
        .map(({ chainId, rewards, ...rest }) => {
            const network = getNetworkByEvmChainId(networkConfigDeps, chainId);

            const rewardsWithFiat = rewards.map(reward => {
                const claimable = asBaseCurrencyAmount(new BigNumber(reward.claimable));

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
                    networkConfigDeps,
                    network.symbol,
                    reward.token.address,
                );
                const fiatRateKey = getFiatRateKey(
                    network.symbol,
                    baseCurrency,
                    toTokenAddress(tokenAddress),
                );
                const rate = currentFiatRates?.[fiatRateKey]?.rate;
                const ticker = getTickerFromFiatRateKey(networkConfigDeps, fiatRateKey);

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

            return {
                ...rest,
                chainId,
                rewards: rewardsWithFiat,
            };
        })
        .filter(chainRewards => chainRewards.rewards.length > 0);

    return {
        chainsRewardsWithFiat,
        missingRateTickers,
    };
}

interface UseExtendMerklRewardsWithFiatProps {
    chainsRewards?: MerklChainsRewards;
    baseCurrency: BaseCurrencyCode;
    currentFiatRates: RatesByKey | undefined;
}

export function useExtendMerklRewardsWithFiat({
    chainsRewards,
    baseCurrency,
    currentFiatRates,
}: UseExtendMerklRewardsWithFiatProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    return useMemo(
        () =>
            extendMerklRewardsWithFiat(
                networkConfigDeps,
                chainsRewards,
                baseCurrency,
                currentFiatRates,
            ),
        [networkConfigDeps, chainsRewards, baseCurrency, currentFiatRates],
    );
}

export type ChainRewardsWithFiat = ReturnType<
    typeof extendMerklRewardsWithFiat
>['chainsRewardsWithFiat'][number];
