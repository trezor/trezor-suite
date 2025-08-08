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

export const StakeState = {
    Inactive: 'inactive',
    Activating: 'activating',
    Active: 'active',
    Deactivating: 'deactivating',
    Deactivated: 'deactivated',
};
