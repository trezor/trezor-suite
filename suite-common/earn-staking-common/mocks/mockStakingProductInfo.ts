import { type StakingProductInfo, asStakingProviderId } from '../src';

export const mockStakingProductInfo = (
    overrides: Partial<StakingProductInfo> = {},
): StakingProductInfo => ({
    rate: 3.08,
    entryPeriodDays: 1,
    exitPeriodDays: 5,
    nextRewardAt: 1_777_000_000_000,
    targets: [
        {
            address: 'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
            providerId: asStakingProviderId('everstake'),
            name: 'EVE6',
            rate: 2.4,
        },
    ],
    ...overrides,
});
