import type { NetworkIcons } from '@trezor/network-assets';

/** @serviceContract */
export type NetworkIcon<TSymbol extends string = string> = {
    getIcons(symbol: TSymbol): NetworkIcons;
    /** Token identifiers used as logo CDN lookup keys, not wallet addresses or URLs. */
    getTokenLogoIdentifiers(
        symbol: TSymbol,
        contract: string,
    ): readonly string[] | Promise<readonly string[]>;
    isWrappedNativeToken?(symbol: TSymbol, contract: string): boolean;
};
