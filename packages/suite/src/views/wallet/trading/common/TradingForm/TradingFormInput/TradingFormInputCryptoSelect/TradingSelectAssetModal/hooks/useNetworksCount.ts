import { useMemo } from 'react';

import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';

import { SelectAssetOptionProps } from 'src/types/trading/trading';

const getNetworkCount = (options: SelectAssetOptionProps[]) => {
    const networkNetworkGroups = options
        .filter(item => item.type === 'group' && item.networkName && item.coingeckoId)
        .map(networkGroup => ({
            ...networkGroup,
            tradeCryptoId: getNetworkByCoingeckoId(networkGroup.coingeckoId!)?.tradeCryptoId,
        }))
        .filter(group => group.tradeCryptoId !== undefined)
        .reduce(
            (result, group) => {
                result.coingeckoIds.add(group.coingeckoId);
                result.tradeCryptoIds.add(group.tradeCryptoId);

                return result;
            },
            {
                coingeckoIds: new Set(),
                tradeCryptoIds: new Set(),
            },
        );

    const networkCurrencies = options.filter(
        item =>
            item.type === 'currency' &&
            !item.contractAddress &&
            !networkNetworkGroups.coingeckoIds.has(item.coingeckoId) &&
            !networkNetworkGroups.tradeCryptoIds.has(item.coingeckoId),
    );

    return networkNetworkGroups.coingeckoIds.size + networkCurrencies.length;
};

export function useNetworksCount(options: SelectAssetOptionProps[]): number {
    return useMemo(() => getNetworkCount(options), [options]);
}
