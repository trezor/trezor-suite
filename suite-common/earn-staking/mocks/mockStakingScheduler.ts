import { mock } from '@trezor/dependency-injection';

import type { StakingScheduler } from '../src/createStakingScheduler';

export const mockStakingScheduler = (
    overrides: Partial<StakingScheduler> = {},
): StakingScheduler => ({
    start: mock<StakingScheduler['start']>(() => {}),
    stop: mock<StakingScheduler['stop']>(() => {}),
    scheduleRevalidation: mock<StakingScheduler['scheduleRevalidation']>(() => {}),
    ...overrides,
});
