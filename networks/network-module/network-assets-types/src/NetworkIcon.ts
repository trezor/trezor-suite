import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkIconPaths, NetworkIcons } from './NetworkAssetsModule';

/** @serviceContract */
export type NetworkIcon = {
    getIcon: (symbol: NetworkSymbol) => NetworkIcons;
    /** Original SVG file paths for Node tools, without loading the SVG modules. */
    getIconPaths: (symbol: NetworkSymbol) => NetworkIconPaths;
    getCryptoIcon: (symbol: string) => string | undefined;
    getNetworkIcon: (symbol: NetworkSymbol) => string | undefined;
    hasCryptoIcon: (symbol: string) => boolean;
    hasNetworkIcon: (symbol: string) => symbol is NetworkSymbol;
    isTestnetNetworkIcon: (symbol: NetworkSymbol) => boolean;
    /** Detects wrapped native tokens so callers can use the native coin icon. */
    isWrappedNativeToken: (symbol: string, contract?: string | null) => boolean;
    /** Returns logo lookup keys, with family-specific normalization and optional async resolution. */
    getTokenLogoIdentifiers: (
        symbol: string,
        contract?: string | null,
    ) => readonly string[] | Promise<readonly string[]>;
};
