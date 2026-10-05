import type { NetworkIcon } from '@trezor/network-assets-types';
import type { NetworkConfigState, NetworkSymbol } from '@trezor/network-module-types';

import {
    selectNetworkConfig,
    selectNetworkConfigByCoingeckoId,
} from '../../network-display/networkDisplaySelectors';

export type ShouldShowNetworkIconDeps = Pick<NetworkIcon, 'hasNetworkIcon'>;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type LogoCandidate = { address: string; src: string; srcSet: string };

export const resolvedLogoCache = new Map<string, LogoCandidate>();
export const failedAddressesCache = new Set<string>();

export const makeCacheKey = (coingeckoId: string, addressesKey: string) =>
    `${coingeckoId}::${addressesKey}`;

export const makeAddressKey = (coingeckoId: string, address: string) =>
    `${coingeckoId}::${address}`;

export function shouldShowNetworkIcon(
    deps: ShouldShowNetworkIconDeps,
    state: NetworkConfigState,
    networkSymbol?: NetworkSymbol,
    contractAddress?: string | null,
): boolean {
    return !!(
        networkSymbol &&
        deps.hasNetworkIcon(networkSymbol) &&
        Boolean(contractAddress) &&
        selectNetworkConfig(state, networkSymbol)?.features?.includes('tokens')
    );
}

export const getCoingeckoIdAndContractAddressIncludesNativeTokens = (
    state: NetworkConfigState,
    coingeckoId: string,
    contractAddress: readonly string[] | undefined,
) => {
    const mainNetworkSymbol = selectNetworkConfigByCoingeckoId(
        state,
        coingeckoId,
    )?.displaySymbol?.toLowerCase();

    const addresses = ([] as Array<string | undefined>)
        .concat(contractAddress ? [...contractAddress] : [])
        .map(addr => addr ?? ZERO_ADDRESS);

    const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

    const nativeConfig = mainNetworkSymbol
        ? selectNetworkConfig(state, mainNetworkSymbol)
        : undefined;
    const shouldUseTradeId = hasNative && !!nativeConfig;

    const resolvedCoingeckoId = shouldUseTradeId
        ? (nativeConfig.tradeCryptoId ?? coingeckoId)
        : coingeckoId;

    return {
        coingeckoId: resolvedCoingeckoId,
        contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
    };
};
