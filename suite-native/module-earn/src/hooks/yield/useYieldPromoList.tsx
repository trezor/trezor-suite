import { useMemo } from 'react';

import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { compareEarnByApyDesc } from '@suite-common/wallet-utils';

import { type YieldPromoListItem } from '../../types';

export const useYieldPromoList = () => {
    const { data: yieldOpportunities, isLoading, isError, refetch } = useAllYieldOpportunities();

    const vaults: YieldPromoListItem[] = useMemo(() => {
        const items: YieldPromoListItem[] = [];

        for (const vault of yieldOpportunities ?? []) {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network) continue;
            if (!vault.token.address) continue;

            const stablecoinSymbol = toTokenSymbol(vault.token.symbol);

            const apy = vault.rewardRate.total
                ? Number((vault.rewardRate.total * 100).toFixed(2))
                : null;

            const underlyingTokenContract = toTokenAddress(vault.token.address);
            const receiptTokenContract = vault.outputToken?.address
                ? toTokenAddress(vault.outputToken.address)
                : null;

            const item = {
                id: vault.id,
                yieldId: vault.id,
                vaultName: vault.outputToken?.name ?? '',
                tokenSymbol: stablecoinSymbol,
                networkSymbol: network.symbol,
                underlyingTokenContract,
                receiptTokenContract,
                contractAddress: underlyingTokenContract,
                tokenContractAddress: underlyingTokenContract,
                apy,
                token: vault.token,
                outputToken: vault.outputToken,
                pricePerShareState: vault.state?.pricePerShareState,
            } satisfies YieldPromoListItem;

            items.push(item);
        }

        return items.sort(compareEarnByApyDesc(item => item.apy));
    }, [yieldOpportunities]);

    return {
        vaults,
        isLoading,
        isError: isError || (!isLoading && yieldOpportunities === undefined),
        refetch,
    };
};
