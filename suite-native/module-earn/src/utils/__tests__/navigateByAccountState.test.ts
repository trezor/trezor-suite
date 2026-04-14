import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { RootStackRoutes } from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { navigateByAccountState } from '../navigateByAccountState';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: jest.fn(),
    formatNetworkAmount: jest.fn(),
    getStakingLimitsByNetworkSymbol: jest.fn(),
}));

const mockGetAccountTotalStakingBalance = jest.mocked(getAccountTotalStakingBalance);
const mockFormatNetworkAmount = jest.mocked(formatNetworkAmount);
const mockGetStakingLimitsByNetworkSymbol = jest.mocked(getStakingLimitsByNetworkSymbol);

const mockNavigate = jest.fn();

const mockLimits = {
    MIN_AMOUNT_FOR_STAKING: new BigNumber(0.1),
    MIN_AMOUNT_FOR_STAKING_DASHBOARD: new BigNumber(0.1),
    MAX_AMOUNT_FOR_STAKING: new BigNumber(1_000_000),
    MIN_FOR_WITHDRAWALS: new BigNumber(0),
    MIN_BALANCE_FOR_FEE_BUFFER: new BigNumber(0.005),
    MIN_BALANCE_FOR_STAKING: new BigNumber(0.1),
};

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: 'test-account-key' as AccountKey,
        symbol: 'eth',
        availableBalance: '1000000000000000000',
        formattedBalance: '1.0',
        ...overrides,
    }) as Account;

describe('navigateByAccountState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates to StakingManagement when account has staked balance', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('1000000000000000');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });
    });

    it('navigates to HowStakeWorksScreen when account has sufficient balance but no stake', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('0');
        mockGetStakingLimitsByNetworkSymbol.mockReturnValue(mockLimits);
        mockFormatNetworkAmount.mockReturnValue('1.0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: 'eth',
            accountKey: account.key,
        });
    });

    it('navigates to StakingInsufficientBalance when account has insufficient balance', () => {
        const account = createMockAccount({ availableBalance: '100' });
        mockGetAccountTotalStakingBalance.mockReturnValue('0');
        mockGetStakingLimitsByNetworkSymbol.mockReturnValue(mockLimits);
        mockFormatNetworkAmount.mockReturnValue('0.0000001');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingInsufficientBalance, {
            accountKey: account.key,
        });
    });

    it('navigates to sufficient balance screen when staked balance is null', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue(null);
        mockGetStakingLimitsByNetworkSymbol.mockReturnValue(mockLimits);
        mockFormatNetworkAmount.mockReturnValue('1.0');

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: 'eth',
            accountKey: account.key,
        });
    });

    it('does not navigate when staking limits are null', () => {
        const account = createMockAccount();
        mockGetAccountTotalStakingBalance.mockReturnValue('0');
        mockGetStakingLimitsByNetworkSymbol.mockReturnValue(null);

        navigateByAccountState(account, mockNavigate);

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
