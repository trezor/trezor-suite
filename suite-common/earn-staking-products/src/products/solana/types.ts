import { type SolanaStakeAccount } from '@suite-common/earn-staking-common';

export type ParsedSolanaStakeAccount = SolanaStakeAccount & {
    voteAccount: string | null;
};
