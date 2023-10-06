import { ParsedTransactionWithMeta } from '@solana/web3.js';

export type SolanaValidParsedTxWithMeta = ParsedTransactionWithMeta & {
    meta: Required<NonNullable<ParsedTransactionWithMeta['meta']>>;
    transaction: Required<ParsedTransactionWithMeta['transaction']>;
    blockTime: Required<NonNullable<ParsedTransactionWithMeta['blockTime']>>;
};

export type TokenDetailByMint = { [mint: string]: { name: string; symbol: string } };
export type {
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
} from '@solana/web3.js';
