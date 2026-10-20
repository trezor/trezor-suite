import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    getDaysToAddToPoolFixture,
    getDaysToAddToPoolInitialFixture,
    getDaysToUnstakeFixture,
} from './__fixtures__/everstake';
import { DAYS_TO_ADD_TO_POOL_DEFAULT, UNSTAKING_ETH_PERIOD } from './everstakeConstants';
import {
    EVERSTAKE_TIMELINE_DEFAULTS,
    getDaysToAddToPool,
    getDaysToUnstake,
    getEverstakeExitPeriodInDays,
    getEverstakeInitialEntryDays,
    getEverstakeNextRewardPayoutDays,
    getEverstakeTimelines,
} from './everstakeTimelines';

type GetDaysArgs = {
    unstakeTxs: WalletAccountTransaction[];
    stakeTxs: WalletAccountTransaction[];
    validatorsQueue?: EthValidatorsQueue;
};

const mockCurrentTime = (timestampInSeconds: number) => {
    jest.spyOn(Date, 'now').mockImplementation(() => timestampInSeconds * 1000);
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe(getDaysToAddToPool.name, () => {
    getDaysToAddToPoolFixture.forEach(test => {
        it(test.description, () => {
            const { stakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = getDaysToAddToPool(stakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe(getDaysToUnstake.name, () => {
    getDaysToUnstakeFixture.forEach(test => {
        it(test.description, () => {
            const { unstakeTxs, validatorsQueue } = test.args as GetDaysArgs;
            mockCurrentTime(1720615417); // mock current time to 2024-07-10
            const result = getDaysToUnstake(unstakeTxs, validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});

describe(getEverstakeInitialEntryDays.name, () => {
    getDaysToAddToPoolInitialFixture.forEach(test => {
        it(test.description, () => {
            const { validatorsQueue } = test.args as GetDaysArgs;
            const result =
                getEverstakeInitialEntryDays(validatorsQueue) ?? DAYS_TO_ADD_TO_POOL_DEFAULT;
            expect(result).toEqual(test.result);
        });
    });

    it('is unknown without a queue estimate', () => {
        expect(getEverstakeInitialEntryDays(undefined)).toBeUndefined();
        expect(EVERSTAKE_TIMELINE_DEFAULTS.entryDays).toBe(DAYS_TO_ADD_TO_POOL_DEFAULT);
    });
});

describe(getEverstakeExitPeriodInDays.name, () => {
    it('sums the withdraw and exit times in days', () => {
        expect(getEverstakeExitPeriodInDays({ withdrawTime: 86400, exitTime: 172800 })).toBe(3);
    });

    it('falls back to the fixed period without an estimate', () => {
        expect(getEverstakeExitPeriodInDays({ withdrawTime: 86400 })).toBe(UNSTAKING_ETH_PERIOD);
        expect(getEverstakeExitPeriodInDays(undefined)).toBe(UNSTAKING_ETH_PERIOD);
    });
});

describe(getEverstakeNextRewardPayoutDays.name, () => {
    it('rounds the payout to days with a one day minimum', () => {
        expect(
            getEverstakeNextRewardPayoutDays({ stats: { apy: 3, nextRewardPayout: 3600 } }),
        ).toBe(1);
        expect(
            getEverstakeNextRewardPayoutDays({ stats: { apy: 3, nextRewardPayout: 2.2 * 86400 } }),
        ).toBe(2);
    });

    it('is null without stats', () => {
        expect(getEverstakeNextRewardPayoutDays(undefined)).toBeNull();
        expect(getEverstakeNextRewardPayoutDays({ validators: {} })).toBeNull();
    });
});

describe(getEverstakeTimelines.name, () => {
    it('combines the stats and the account transactions into one estimate', () => {
        mockCurrentTime(1720615417);
        const stakeTxs = [{ blockTime: 1720615417 - 86400 }] as WalletAccountTransaction[];
        const unstakeTxs = [{ blockTime: 1720615417 }] as WalletAccountTransaction[];

        expect(
            getEverstakeTimelines(
                {
                    stats: { apy: 3, nextRewardPayout: 86400 * 3 },
                    validators: {
                        addingDelay: 86400,
                        activationTime: 86400 * 2,
                        withdrawTime: 86400,
                        exitTime: 86400 * 4,
                    },
                },
                { stakeTxs, unstakeTxs },
            ),
        ).toEqual({
            entryDays: 2,
            exitDays: 5,
            initialEntryDays: 3,
            exitPeriodDays: 5,
            nextRewardPayoutDays: 3,
        });
    });

    it('keeps the fallbacks without stats', () => {
        expect(getEverstakeTimelines(undefined, { stakeTxs: [], unstakeTxs: [] })).toEqual({
            entryDays: undefined,
            exitDays: undefined,
            initialEntryDays: undefined,
            exitPeriodDays: UNSTAKING_ETH_PERIOD,
            nextRewardPayoutDays: null,
        });
    });
});
