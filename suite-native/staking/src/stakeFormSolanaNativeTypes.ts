import { type Account } from '@suite-common/wallet-types';
import type { SupportedSolanaNetworkSymbols } from '@trezor/coins-solana/types';

export type SolanaAccount = Account & {
    networkType: 'solana';
    symbol: SupportedSolanaNetworkSymbols;
};

export type SolanaStakingComposeRejectValue = { error: string; message?: string };
