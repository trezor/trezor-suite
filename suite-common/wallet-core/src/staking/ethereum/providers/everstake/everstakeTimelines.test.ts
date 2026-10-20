import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    getDaysToAddToPoolFixture,
    getDaysToAddToPoolInitialFixture,
    getDaysToUnstakeFixture,
} from './__fixtures__/everstake';
import {
    getDaysToAddToPool,
    getDaysToAddToPoolInitial,
    getDaysToUnstake,
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

describe(getDaysToAddToPoolInitial.name, () => {
    getDaysToAddToPoolInitialFixture.forEach(test => {
        it(test.description, () => {
            const { validatorsQueue } = test.args as GetDaysArgs;
            const result = getDaysToAddToPoolInitial(validatorsQueue);
            expect(result).toEqual(test.result);
        });
    });
});
