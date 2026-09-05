import { type Getter } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import type { PartialRecord } from '@trezor/type-utils';

export type SimpleTokenStructure = string[];

export interface AdvancedTokenStructure {
    [contractAddress: string]: {
        symbol: string;
        name: string;
        home_domain?: string;
        rating?: number;
    };
}

export type TokenStructure = SimpleTokenStructure | AdvancedTokenStructure;

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
