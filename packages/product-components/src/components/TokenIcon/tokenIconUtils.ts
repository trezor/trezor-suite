import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import {
    type NetworkConfigDeps,
    type NetworkSymbolExtended,
    findNetworkByCoingeckoId,
    getNetworks,
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
    deps: NetworkConfigDeps,
    networkSymbol?: NetworkSymbolExtended,
    contractAddress?: string | null,
) {
    return (
        networkSymbol &&
        isNetworkIconSymbol(networkSymbol) &&
        deps.networkModuleRepository.isSupportedNetwork(networkSymbol) &&
        Boolean(contractAddress) &&
        deps.getNetworkConfig(networkSymbol).features.includes('tokens')
    );
}

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    deps: NetworkConfigDeps,
    coingeckoId: string,
    contractAddress: string[] | undefined,
) => {
    const mainNetworkSymbol = findNetworkByCoingeckoId(
        getNetworks(deps),
        coingeckoId,
    )?.displaySymbol.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ?? [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

    const shouldUseTradeId =
        hasNative &&
        !!mainNetworkSymbol &&
        deps.networkModuleRepository.isSupportedNetwork(mainNetworkSymbol);

    const resolvedCoingeckoId = shouldUseTradeId
        ? (deps.getNetworkConfig(mainNetworkSymbol).tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
