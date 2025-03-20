export type SolanaTokenAccountInfo = {
    address: string;
    mint: string | undefined;
    decimals: number | undefined;
};

export type SolanaStakingAccount = {
    status: string;
    stake?: string;
    rentExemptReserve: string;
};

export type TokenDetailByMint = { [mint: string]: { name: string; symbol: string } };

export const StakeState = {
    Inactive: 'inactive',
    Activating: 'activating',
    Active: 'active',
    Deactivating: 'deactivating',
    Deactivated: 'deactivated',
};
