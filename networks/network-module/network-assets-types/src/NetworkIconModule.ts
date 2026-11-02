import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkIconSource } from './NetworkAssetsModule';

export type GetCryptoIcon = (symbol: NetworkSymbol) => NetworkIconSource | undefined;

export type GetCryptoIconDep = { getCryptoIcon: GetCryptoIcon };

export type GetNetworkIcon = (symbol: NetworkSymbol) => NetworkIconSource;

export type GetNetworkIconDep = { getNetworkIcon: GetNetworkIcon };

export type HasCryptoIcon = (symbol: string) => boolean;

export type HasCryptoIconDep = { hasCryptoIcon: HasCryptoIcon };

export type HasNetworkIcon = (symbol: string) => symbol is NetworkSymbol;

export type HasNetworkIconDep = { hasNetworkIcon: HasNetworkIcon };

/** Returns logo lookup keys, with family-specific normalization and optional async resolution. */
export type GetTokenLogoIdentifiers = (
    symbol: string,
    contract?: string | null,
) => readonly string[] | Promise<readonly string[]>;

export type GetTokenLogoIdentifiersDep = { getTokenLogoIdentifiers: GetTokenLogoIdentifiers };

/** @serviceContract */
export type NetworkIconModule = GetCryptoIconDep &
    GetNetworkIconDep &
    HasCryptoIconDep &
    HasNetworkIconDep &
    GetTokenLogoIdentifiersDep;
