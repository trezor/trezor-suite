import { mock } from '@trezor/dependency-injection';

import type { StakingNotifier } from '../src/staking/stakingNotifier';

export const mockStakingNotifier = (): StakingNotifier => ({
    onTransactionPushed: mock<StakingNotifier['onTransactionPushed']>(() => {}),
    onTransactionPushFailed: mock<StakingNotifier['onTransactionPushFailed']>(() => {}),
});
