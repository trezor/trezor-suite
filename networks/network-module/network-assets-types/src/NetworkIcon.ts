import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkIconSource } from './NetworkAssetsModule';

export type GetCryptoIcon = (symbol: string) => NetworkIconSource | undefined;

export type GetNetworkIcon = (symbol: NetworkSymbol) => NetworkIconSource;

export type HasCryptoIcon = (symbol: string) => boolean;

export type HasNetworkIcon = (symbol: string) => symbol is NetworkSymbol;

/** Returns logo lookup keys, with family-specific normalization and optional async resolution. */
export type GetTokenLogoIdentifiers = (
    symbol: string,
    contract?: string | null,
) => readonly string[] | Promise<readonly string[]>;

/** @serviceContract */
export type NetworkIcon = {
    getCryptoIcon: GetCryptoIcon;
    getNetworkIcon: GetNetworkIcon;
    hasCryptoIcon: HasCryptoIcon;
    hasNetworkIcon: HasNetworkIcon;
    getTokenLogoIdentifiers: GetTokenLogoIdentifiers;
};
