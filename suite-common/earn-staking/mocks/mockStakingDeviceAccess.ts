import { mock } from '@trezor/dependency-injection';

import type { StakingDeviceAccess } from '../src/createStakingDeviceAccess';

type RunMock = (attemptId: string, callback: () => Promise<unknown>) => Promise<unknown>;

// A jest mock cannot carry the generic `run<T>` signature, so the mock is typed once at this
// boundary.
export const mockStakingDeviceAccessRun = (
    implementation: RunMock = (_attemptId, callback) => callback(),
) => mock<RunMock>(implementation) as StakingDeviceAccess['run'];

export const mockStakingDeviceAccess = (
    overrides: Partial<StakingDeviceAccess> = {},
): StakingDeviceAccess => ({
    run: mockStakingDeviceAccessRun(),
    cancel: mock<StakingDeviceAccess['cancel']>(() => {}),
    ...overrides,
});
