// constants from https://nemproject.github.io/

export enum Networks {
    mainnet = 0x68,
    testnet = 0x98,
    mijin = 0x60,
}

export enum TxType {
    TRANSFER = 0x0101,
    COSIGNING = 0x0102,
    IMPORTANCE_TRANSFER = 0x0801,
    AGGREGATE_MODIFICATION = 0x1001,
    MULTISIG_SIGNATURE = 0x1002,
    MULTISIG = 0x1004,
    PROVISION_NAMESPACE = 0x2001,
    MOSAIC_CREATION = 0x4001,
    SUPPLY_CHANGE = 0x4002,
}

export enum TxVersion {
    mainnet = Networks.mainnet << 24,
    testnet = Networks.testnet << 24,
    mijin = Networks.mijin << 24,
}
