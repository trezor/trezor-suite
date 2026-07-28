import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { RootStackRoutes } from '@suite-native/navigation';

import { resolveStakingHomeRoute } from './resolveStakingHomeRoute';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: jest.fn(),
}));

const mockGetAccountTotalStakingBalance = jest.mocked(getAccountTotalStakingBalance);

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: mockAccountKey({ descriptor: 'testAccountKey' }),
        symbol: 'sol',
        ...overrides,
    }) as Account;

describe('resolveStakingHomeRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns the staking dashboard when the account has a staked balance', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000000');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.StakingManagement,
            params: { accountKey: account.key },
        });
    });

    it('returns StakingDetail for a Cardano account with a staked balance', () => {
        const account = createMockAccount({ symbol: 'ada' });
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.StakingDetail,
            params: { accountKey: account.key },
        });
    });

    it('returns the "How staking works" intro for a first-time Solana staker', () => {
        const account = createMockAccount({ symbol: 'sol' });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: 'sol', accountKey: account.key },
        });
    });

    it('returns the "How staking works" intro when the staked balance is null', () => {
        const account = createMockAccount({ symbol: 'eth' });
        mockGetAccountTotalStakingBalance.mockReturnValue(null);

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: 'eth', accountKey: account.key },
        });
    });
});
