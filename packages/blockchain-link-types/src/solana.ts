import type { ParsedTransactionWithMeta } from '@solana/web3.js';

export type SolanaValidParsedTxWithMeta = ParsedTransactionWithMeta & {
    meta: Required<NonNullable<ParsedTransactionWithMeta['meta']>>;
    transaction: Required<ParsedTransactionWithMeta['transaction']>;
    blockTime: Required<NonNullable<ParsedTransactionWithMeta['blockTime']>>;
};

export type SolanaTokenAccountInfo = {
    address: string;
    mint: string | undefined;
    decimals: number | undefined;
};

export type {
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    AccountInfo,
    ParsedAccountData,
    PublicKey,
} from '@solana/web3.js';

export type TokenDetailByMint = { [mint: string]: { name: string; symbol: string } };
