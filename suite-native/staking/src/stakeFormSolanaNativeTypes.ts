import { type Account } from '@suite-common/wallet-types';
import type { SupportedSolanaNetworkSymbols } from '@trezor/coins-solana/types';

import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

export type SolanaAccount = Account & {
    networkType: 'solana';
    symbol: SupportedSolanaNetworkSymbols;
};

export type SolanaStakingType = StakeNativeType;

export type SignSolanaStakingRejectValue = SignStakeNativeRejectValue;

export type SolanaStakingComposeRejectValue = { error: string; message?: string };
