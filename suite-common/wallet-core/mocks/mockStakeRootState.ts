import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { Account } from '@suite-common/wallet-types';

import { stakeInitialState } from '../src/staking/stakingReducer';
import type { StakeRootState } from '../src/staking/stakingReducerTypes';
import type { TransactionsByAccount } from '../src/transactions/transactionsReducerTypes';

type MockStakeRootStateParams = {
    accounts: Account[];
    transactions?: TransactionsByAccount;
};

export const mockStakeRootState = ({
    accounts,
    transactions = {},
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
            stake: stakeInitialState,
        },
        device: { devices: [device], selectedDevice: device, buttonRequestsByPath: {} },
    };
};
