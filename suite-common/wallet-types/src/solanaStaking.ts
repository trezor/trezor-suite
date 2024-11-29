import type { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js';

export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export type SupportedSolanaNetworkSymbols = (typeof supportedSolanaNetworkSymbols)[number];

export type SolanaStakingAccount = {
    account: AccountInfo<Buffer | ParsedAccountData>;
    pubkey: PublicKey;
};
