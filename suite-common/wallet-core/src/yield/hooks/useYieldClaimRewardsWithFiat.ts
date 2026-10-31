import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    useExtendMerklRewardsWithFiat,
    useGetMerklRewards,
    useGetMerklRewardsQueryEntries,
} from '@suite-common/earn-stablecoin-api';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import { type CryptoBaseCurrencyPair, toTokenAddress } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol, getFiatRateKey } from '@suite-common/wallet-utils';

import { selectYieldClaimAccounts } from '../../earn/earnDashboardSelectors';
import {
    createStableFiatRateKeys,
    selectCurrentFiatRatesByFiatRateKeys,
} from '../../fiat-rates/fiatRatesSelectors';
import { type FiatRatesRootState } from '../../fiat-rates/fiatRatesTypes';
import { useMissingRateTickersQuery } from '../../fiat-rates/useMissingRateTickersQuery';
import { selectBaseCurrency } from '../../settings/walletSettingsReducer';

export const useYieldClaimRewardsWithFiat = () => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const claimAccounts = useSelector(selectYieldClaimAccounts);

    const merklRewardsQueryEntries = useGetMerklRewardsQueryEntries(claimAccounts);

    const {
        data: chainsRewards,
        isLoading: isMerklRewardsLoading,
        isError: isMerklRewardsError,
    } = useGetMerklRewards(merklRewardsQueryEntries);

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

    return {
        claimRewardsWithFiat: chainsRewardsWithFiat,
        isClaimLoading: merklRewardsQueryEntries.length > 0 && isMerklRewardsLoading,
        isClaimError: merklRewardsQueryEntries.length > 0 && isMerklRewardsError,
    };
};
