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
