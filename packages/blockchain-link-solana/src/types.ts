import type { AccountInfo, StakeType, Transaction } from '@trezor/blockchain-link-types';

export type SolanaTokenAccountInfo = {
    address: string;
    mint: string | undefined;
    decimals: number | undefined;
};

export const StakeState = {
    Inactive: 'inactive',
    Activating: 'activating',
    Active: 'active',
    Deactivating: 'deactivating',
    Deactivated: 'deactivated',
};

export interface SolanaStakingAccount {
    status: string;
    stake?: string;
    rentExemptReserve: string;
    voterPubkey?: string;
}

export type TokenDetailByMint = {
    [mint: string]: { name: string; symbol: string; home_domain?: string; rating?: number };
};

export interface SolanaMisc {
    owner?: string;
    rent?: number;
    solStakingAccounts?: SolanaStakingAccount[];
    solExternalStakingAccounts?: SolanaStakingAccount[];
    solEpoch?: number;
}

export type SolanaTransaction = Transaction<{
    status: 'confirmed';
    stakeOperation?: { type: StakeType; amount: string };
}>;

export type SolanaAccountInfo = AccountInfo<SolanaMisc>;
