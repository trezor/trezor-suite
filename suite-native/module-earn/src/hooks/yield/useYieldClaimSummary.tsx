import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type YieldDtoV2,
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
} from '@suite-common/earn-stablecoin-api';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    createStableFiatRateKeys,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type CryptoBaseCurrencyPair, toTokenAddress } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol, getFiatRateKey } from '@suite-common/wallet-utils';

import {
    type EarnListRootState,
    selectYieldClaimAccountItems,
    selectYieldClaimAccounts,
    selectYieldClaimListItems,
    selectYieldClaimTokens,
    selectYieldClaimTotalFiatAmount,
} from '../../earnListSelectors';

type UseYieldClaimRewardsProps = {
    yieldOpportunities: YieldDtoV2[];
};

export const useYieldClaimSummary = ({ yieldOpportunities }: UseYieldClaimRewardsProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const claimAccounts = useSelector(selectYieldClaimAccounts);

    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(claimAccounts);

    const { data: chainsRewards, isLoading: isMerklRewardsLoading } =
        useGetMerklRewards(merklRewardsQueryEntries);

    const rewardFiatRateKeys = useMemo(() => {
        const fiatRateKeys: CryptoBaseCurrencyPair[] = [];

        for (const chainRewards of chainsRewards ?? []) {
            const network = getNetworkByEvmChainId(chainRewards.chainId);

            if (!network) continue;

            for (const reward of chainRewards.rewards) {
                const { symbol } = network;
                const contractAddress = toTokenAddress(
                    getContractAddressForNetworkSymbol(symbol, reward.token.address),
                );
                const fiatRateKey = getFiatRateKey(symbol, baseCurrency, contractAddress);
                fiatRateKeys.push(fiatRateKey);
            }
        }

        return createStableFiatRateKeys(...new Set(fiatRateKeys));
    }, [chainsRewards, baseCurrency]);

    const currentFiatRates = useSelector((state: FiatRatesRootState) =>
        selectCurrentFiatRatesByFiatRateKeys(state, rewardFiatRateKeys),
    );

    const { chainsRewardsWithFiat, missingRateTickers } = useExtendMerklRewardsWithFiat({
        chainsRewards,
        baseCurrency,
        currentFiatRates,
    });

    useMissingRateTickersQuery({ missingRateTickers, baseCurrencyCode: baseCurrency });

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, chainsRewardsWithFiat),
    );
    const claimTokens = useSelector((state: EarnListRootState) =>
        selectYieldClaimTokens(state, chainsRewardsWithFiat),
    );
    const totalClaimableFiatAmount = useSelector((state: EarnListRootState) =>
        selectYieldClaimTotalFiatAmount(state, chainsRewardsWithFiat),
    );
    const claimAccountItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimAccountItems(state, chainsRewardsWithFiat, yieldOpportunities),
    );

    const isClaimItemsLoading = merklRewardsQueryEntries.length > 0 && isMerklRewardsLoading;

    return {
        claimItems,
        claimTokens,
        claimAccountItems,
        totalClaimableFiatAmount,
        isClaimItemsLoading,
    };
};
