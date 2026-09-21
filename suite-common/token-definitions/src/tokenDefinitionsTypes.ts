import { type Getter } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import type { PartialRecord } from '@trezor/type-utils';

export type SimpleTokenStructure = string[];

/**
 * Every known token that has a market cap, from every platform, ranked by market cap in USD.
 * Published as one file next to the per-platform definitions, which stay the complete list of
 * known tokens.
 */
export type RankedTokenStructure = {
    assetPlatformId: string;
    address: string;
    marketCap: number;
}[];

export interface AdvancedTokenStructure {
    [contractAddress: string]: {
        symbol: string;
        name: string;
        home_domain?: string;
        rating?: number;
    };
}

export type TokenStructure = SimpleTokenStructure | RankedTokenStructure | AdvancedTokenStructure;

export enum TokenStructureType {
    SIMPLE = 'simple',
    ADVANCED = 'advanced',
}

export enum DefinitionType {
    NFT = 'nft',
    COIN = 'coin',
}

export enum TokenManagementAction {
    HIDE = 'hide',
    SHOW = 'show',
}

export type TokenDefinitionsState = PartialRecord<NetworkSymbol, TokenDefinitions>;

export type TokenDefinitionsRootState = { tokenDefinitions: TokenDefinitionsState };

export type GetTokenDefinitionsEnabledNetworksDep = {
    getTokenDefinitionsEnabledNetworks: Getter<[], NetworkSymbol[]>;
};

export type TokenDefinition = {
    error: boolean;
    data?: SimpleTokenStructure;
    isLoading: boolean;
    hide: SimpleTokenStructure;
    show: SimpleTokenStructure;
};

export type TokenDefinitions = {
    [DefinitionType.COIN]?: TokenDefinition;
    [DefinitionType.NFT]?: TokenDefinition;
};

export type TokenManagementStorage = { key: string; value: SimpleTokenStructure };

export type { TokenInfo };
