import type z from 'zod';

import { type SolanaBlockchainInfo } from '../schemas';

type SolanaBlockchainInfo = z.infer<typeof SolanaBlockchainInfo>;

export type SolanaStakingInfo = {
    apy: SolanaBlockchainInfo['apr'];
};
