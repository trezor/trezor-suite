export type SimpleTokenStructure = string[];

export interface AdvancedTokenStructure {
    [contractAddress: string]: { symbol: string; name: string };
}

export type TokenStructure = SimpleTokenStructure | AdvancedTokenStructure;

export enum DefinitionType {
    NFT = 'nft',
    COIN = 'coin',
}
