export type EthereumContractAddress = `0x${string}`;

export type EverstakeContracts = {
    readonly pool: EthereumContractAddress;
    readonly accounting: EthereumContractAddress;
    readonly withdrawTreasury: EthereumContractAddress;
};
