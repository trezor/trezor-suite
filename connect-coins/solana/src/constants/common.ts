export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export enum Network {
    Mainnet = 'mainnet-beta',
    Devnet = 'devnet',
}

export const StakeState = {
    Inactive: 'inactive',
    Activating: 'activating',
    Active: 'active',
    Deactivating: 'deactivating',
    Deactivated: 'deactivated',
};
