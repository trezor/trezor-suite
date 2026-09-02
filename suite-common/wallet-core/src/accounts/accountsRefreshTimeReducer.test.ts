import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { accountsActions } from './accountsActions';
import {
    type AccountsRefreshTimeState,
    accountRefreshed,
    accountsRefreshTimeReducer,
    isAccountStaleSelector,
} from './accountsRefreshTimeReducer';

const btcSymbol = asNetworkSymbol('btc');

const account = mockWalletAccount({
    symbol: btcSymbol,
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accA'),
});
const otherAccount = mockWalletAccount({
    symbol: btcSymbol,
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accB'),
});

const NOW = 1_700_000_000_000;

describe('accountsRefreshTimeReducer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(NOW);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('records the timestamp on accountRefreshed', () => {
        const state = accountsRefreshTimeReducer({}, accountRefreshed(account.key));
        expect(state[account.key]).toBe(NOW);
    });

    it('records the timestamp on createAccount and updateAccount', () => {
        // createAccount payload is the account; the reducer only reads payload.key
        const createdAccountAction: ReturnType<typeof accountsActions.createAccount> = {
            type: accountsActions.createAccount.type,
            payload: account,
        };

        const created = accountsRefreshTimeReducer({}, createdAccountAction);
        expect(created[account.key]).toBe(NOW);

        jest.setSystemTime(NOW + 5000);
        const updated = accountsRefreshTimeReducer(created, accountsActions.updateAccount(account));
        expect(updated[account.key]).toBe(NOW + 5000);
    });

    it('drops removed accounts', () => {
        const state: AccountsRefreshTimeState = { [account.key]: NOW, [otherAccount.key]: NOW };
        const next = accountsRefreshTimeReducer(
            state,
            accountsActions.removeAccount([account as Account]),
        );

        expect(next[account.key]).toBeUndefined();
        expect(next[otherAccount.key]).toBe(NOW);
    });

    it('selector returns if an account is stale and needs refresh', () => {
        const wallet = { accountsRefreshTime: { [account.key]: NOW } };
        expect(isAccountStaleSelector({ wallet }, account.key)).toBe(false);
        expect(isAccountStaleSelector({ wallet }, otherAccount.key)).toBe(true);
    });
});
