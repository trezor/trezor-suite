import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { resolveStakingPromoAccounts } from './resolveStakingPromoAccounts';

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        key: mockAccountKey({ descriptor: 'testAccountKey' }),
        symbol: 'ada',
        networkType: 'cardano',
        balance: '0',
        ...overrides,
    }) as Account;

const createDelegatedCardanoAccount = (balance: string): Account =>
    createMockAccount({
        balance,
        misc: { staking: { isActive: true } },
    } as Partial<Account>);

describe('resolveStakingPromoAccounts', () => {
    it('marks a network without a mobile staking flow as desktop only', () => {
        const accounts = [createMockAccount({ symbol: 'trx', networkType: 'tron' })];

        expect(resolveStakingPromoAccounts({ symbol: 'trx', accounts })).toEqual({
            isDesktopOnly: true,
        });
    });

    it('returns every account of a network with a mobile staking flow', () => {
        const ethAccount = createMockAccount({ symbol: 'eth', networkType: 'ethereum' });
        const accounts = [ethAccount, createMockAccount()];

        expect(resolveStakingPromoAccounts({ symbol: 'eth', accounts })).toEqual({
            isDesktopOnly: false,
            navigableAccounts: [ethAccount],
        });
    });

    it('returns only the delegated Cardano accounts', () => {
        const delegatedAccount = createDelegatedCardanoAccount('10000000');
        const accounts = [createMockAccount(), delegatedAccount];

        expect(resolveStakingPromoAccounts({ symbol: 'ada', accounts })).toEqual({
            isDesktopOnly: false,
            navigableAccounts: [delegatedAccount],
        });
    });

    it('returns a Cardano account that is delegated but emptied', () => {
        const emptiedAccount = createDelegatedCardanoAccount('0');

        expect(resolveStakingPromoAccounts({ symbol: 'ada', accounts: [emptiedAccount] })).toEqual({
            isDesktopOnly: false,
            navigableAccounts: [emptiedAccount],
        });
    });

    it('marks Cardano as desktop only when no account is delegated', () => {
        expect(
            resolveStakingPromoAccounts({ symbol: 'ada', accounts: [createMockAccount()] }),
        ).toEqual({ isDesktopOnly: true });
    });
});
