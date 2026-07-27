import type { FeeLevel } from '@trezor/connect-common';

import type { Blockchain } from '../Blockchain';

export interface FeeLevels {
    levels: FeeLevel[];
    load(blockchain: Blockchain, request?: Parameters<Blockchain['estimateFee']>[0]): Promise<void>;
}
