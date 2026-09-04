import { asNetworkSymbol } from '@suite-common/wallet-config';
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
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const ethSymbol = asNetworkSymbol('eth');

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: mockAccountKey({ descriptor: 'testAccountKey' }),
        symbol: solSymbol,
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

    it('returns StakingManagement for a Cardano account with a staked balance', () => {
        const account = createMockAccount({ symbol: adaSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.StakingManagement,
            params: { accountKey: account.key },
        });
    });

    it('returns HowStakeWorks for a Cardano account without a staked balance', () => {
        const account = createMockAccount({ symbol: adaSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: account.symbol, accountKey: account.key },
        });
    });

    it('returns the "How staking works" intro for a first-time Solana staker', () => {
        const account = createMockAccount({ symbol: solSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: solSymbol, accountKey: account.key },
        });
    });

    it('returns the "How staking works" intro when the staked balance is null', () => {
        const account = createMockAccount({ symbol: ethSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue(null);

        expect(resolveStakingHomeRoute(account)).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: ethSymbol, accountKey: account.key },
        });
    });
});
