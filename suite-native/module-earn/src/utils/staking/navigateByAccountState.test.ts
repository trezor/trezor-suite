import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { RootStackRoutes } from '@suite-native/navigation';

import { navigateByAccountState } from './navigateByAccountState';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: jest.fn(),
}));

const mockGetAccountTotalStakingBalance = jest.mocked(getAccountTotalStakingBalance);

const mockNavigate = jest.fn();
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const btcSymbol = asNetworkSymbol('btc');

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: mockAccountKey({ descriptor: 'testAccountKey' }),
        symbol: ethSymbol,
        availableBalance: '1000000000000000000',
        formattedBalance: '1.0',
        ...overrides,
    }) as Account;

describe('navigateByAccountState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates to StakingManagement when an Ethereum account has staked balance', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000000000000');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });
    });

    it('navigates to StakingManagement when a Solana account has staked balance', () => {
        const account = createMockAccount({ symbol: solSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000000');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen when a Solana account has a balance but no stake', () => {
        const account = createMockAccount({ symbol: solSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        // A first-time Solana staker starts at the intro, not the empty dashboard.
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: solSymbol,
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen when a Solana account has insufficient balance and no stake', () => {
        const account = createMockAccount({ symbol: solSymbol, availableBalance: '100' });
        mockGetAccountTotalStakingBalance.mockReturnValue(null);

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: solSymbol,
            accountKey: account.key,
        });
    });

    it('navigates to StakingManagement when a Cardano account has staked balance', () => {
        const account = createMockAccount({ symbol: adaSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });
    });

    it('navigates a Cardano account without a staked balance to HowStakeWorks', () => {
        const account = createMockAccount({ symbol: adaSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: account.symbol,
            accountKey: account.key,
        });
    });

    it('navigates to StakingManagement when a Cardano account is delegated but emptied', () => {
        const account = createMockAccount({
            symbol: adaSymbol,
            networkType: 'cardano',
            misc: { staking: { isActive: true } },
        } as Partial<Account>);
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen when account has sufficient balance but no stake', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: ethSymbol,
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen even when balance is below the staking minimum', () => {
        // The user is never blocked from exploring staking; the form surfaces an info banner instead.
        const account = createMockAccount({ availableBalance: '100' });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: ethSymbol,
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen when staked balance is null', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue(null);

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: ethSymbol,
            accountKey: account.key,
        });
    });

    it('does not navigate when the account is not on a staking network', () => {
        const account = createMockAccount({ symbol: btcSymbol });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
