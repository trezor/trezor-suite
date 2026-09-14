import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import { type NetworkConfigDeps } from '@suite-common/networks';
import {
    type NetworkSymbolExtended,
    getNetwork,
    getNetworkByCoingeckoId,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type LogoCandidate = { address: string; src: string; srcSet: string };

export const resolvedLogoCache = new Map<string, LogoCandidate>();
export const failedAddressesCache = new Set<string>();

export const makeCacheKey = (coingeckoId: string, addressesKey: string) =>
    `${coingeckoId}::${addressesKey}`;

export const makeAddressKey = (coingeckoId: string, address: string) =>
    `${coingeckoId}::${address}`;

export function shouldShowNetworkIcon(
    networkConfigDeps: NetworkConfigDeps,
    networkSymbol?: NetworkSymbolExtended,
    contractAddress?: string | null,
) {
    return (
        networkSymbol &&
        isNetworkIconSymbol(networkSymbol) &&
        isNetworkSymbol(networkConfigDeps, networkSymbol) &&
        Boolean(contractAddress) &&
        getNetworkFeatures(networkConfigDeps, networkSymbol).includes('tokens')
    );
}

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    networkConfigDeps: NetworkConfigDeps,
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const mainNetworkSymbol = getNetworkByCoingeckoId(
        networkConfigDeps,
        coingeckoId,
    )?.displaySymbol.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

    const shouldUseTradeId =
        hasNative && !!mainNetworkSymbol && isNetworkSymbol(networkConfigDeps, mainNetworkSymbol);

    const resolvedCoingeckoId = shouldUseTradeId
        ? (getNetwork(networkConfigDeps, mainNetworkSymbol).tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
