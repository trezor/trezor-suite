import { NetworkSymbol } from '@suite-common/wallet-config';

export type SimpleTokenStructure = string[];

export interface AdvancedTokenStructure {
    [contractAddress: string]: { symbol: string; name: string };
}

export type TokenStructure = SimpleTokenStructure | AdvancedTokenStructure;

export enum DefinitionType {
    NFT = 'nft',
    COIN = 'coin',
}

export type TokenDefinitionsState = {
    [key in NetworkSymbol]?: TokenDefinitions;
};

export type TokenDefinitionsRootState = { tokenDefinitions: TokenDefinitionsState };

type TokenDefinition = {
    error: boolean;
    data?: SimpleTokenStructure;
    isLoading: boolean;
};

export type TokenDefinitions = {
    [DefinitionType.COIN]?: TokenDefinition;
    [DefinitionType.NFT]?: TokenDefinition;
};
