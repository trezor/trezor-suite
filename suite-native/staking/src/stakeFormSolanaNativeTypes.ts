import { type Account } from '@suite-common/wallet-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';

export type SolanaAccount = Account & {
    networkType: 'solana';
    symbol: SolanaNetworkSymbol;
};

export type SolanaStakingComposeRejectValue = { error: string; message?: string };
