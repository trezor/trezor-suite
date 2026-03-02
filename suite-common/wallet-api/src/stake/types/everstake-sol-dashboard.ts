import z from 'zod';

import { SolanaBlockchainInfo } from '../schemas';

type SolanaBlockchainInfo = z.infer<typeof SolanaBlockchainInfo>;

export type SolanaStakingInfo = {
    apy: SolanaBlockchainInfo['apr'];
};
