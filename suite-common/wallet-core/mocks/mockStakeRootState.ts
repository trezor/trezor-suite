import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { Account } from '@suite-common/wallet-types';
import {
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    MOCK_STAKING_NOW_SECONDS,
} from '@suite-common/wallet-types/mocks';

import type { StakeDataState } from '../src/staking/stakingDataSlice';
import { stakeInitialState } from '../src/staking/stakingReducer';
import type { StakeRootState } from '../src/staking/stakingReducerTypes';
import type { TransactionsByAccount } from '../src/transactions/transactionsReducerTypes';

const SECONDS_IN_DAY = 24 * 60 * 60;

export const mockStakeData = (): StakeDataState['data'] => ({
    eth: {
        stats: { apy: 3.08, nextRewardPayout: 5 * SECONDS_IN_DAY },
        validators: {
            activationTime: 3 * SECONDS_IN_DAY,
            exitTime: 2 * SECONDS_IN_DAY,
            withdrawTime: SECONDS_IN_DAY,
            addingDelay: SECONDS_IN_DAY,
            updatedAt: MOCK_STAKING_NOW_SECONDS,
        },
    },
    sol: { stats: { apy: 6.24 } },
    ada: {
        pools: [
            { apy: 2.4, saturation: 80.77, id: MOCK_CARDANO_EVERSTAKE_OTHER_POOL },
            { apy: 2.06, saturation: 62.64, id: MOCK_CARDANO_EVERSTAKE_POOL },
        ],
    },
});

type MockStakeRootStateParams = {
    accounts: Account[];
    transactions?: TransactionsByAccount;
    stakeData?: StakeDataState['data'];
};

export const mockStakeRootState = ({
    accounts,
    transactions = {},
    stakeData = mockStakeData(),
}: MockStakeRootStateParams): StakeRootState => {
    const device = mockSuiteDevice({
        state: { staticSessionId: accounts[0]?.deviceState },
        connected: true,
        available: true,
    });

    return {
        wallet: {
            accounts,
            transactions: { transactions, phishing: {}, fetchStatusDetail: {} },
            stake: {
                ...stakeInitialState,
                data: {
                    error: null,
                    isLoading: false,
                    lastSuccessAt: MOCK_STAKING_NOW_SECONDS * 1000,
                    data: stakeData,
                },
            },
        },
        device: { devices: [device], selectedDevice: device, buttonRequestsByPath: {} },
    };
};
