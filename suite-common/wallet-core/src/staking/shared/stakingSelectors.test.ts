import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    selectStakeAccount,
    selectStakeVotingDelegation,
    selectVotingDelegationOption,
} from './stakingSelectors';
import { DEFAULT_VOTING_OPTION } from '../cardano/cardanoStakingConstants';
import { type AccountVotingDelegation } from '../cardano/cardanoStakingTypes';
import { stakeInitialState } from '../stakingReducer';
import type { StakeRootState, StakeState } from '../stakingReducerTypes';

type CreateStateParams = {
    stake?: Partial<StakeState>;
    accounts?: Account[];
};

const createState = ({ stake = {}, accounts = [] }: CreateStateParams = {}): StakeRootState => ({
    device: { devices: [], buttonRequestsByPath: {} },
    wallet: {
        stake: { ...stakeInitialState, ...stake },
        accounts,
        transactions: { transactions: {}, phishing: {}, fetchStatusDetail: {} },
    },
});

describe('selectVotingDelegationOption', () => {
    const accountKey = mockAccountKey({ descriptor: 'a' });
    const otherAccountKey = mockAccountKey({ descriptor: 'b' });
    const anotherDrep: AccountVotingDelegation['option'] = {
        type: 'another_drep',
        drepId: 'drep1abc',
    };

    // `toBe` throughout: components read this through `useSelector`, so both branches have to return
    // a reference that only changes when the selection does.
    it('falls back to Everstake when no option was confirmed', () => {
        expect(selectVotingDelegationOption(createState(), accountKey)).toBe(DEFAULT_VOTING_OPTION);
    });

    it('returns the option confirmed for the queried account', () => {
        const state = createState({
            stake: { votingDelegation: { accountKey, option: anotherDrep } },
        });

        expect(selectVotingDelegationOption(state, accountKey)).toBe(anotherDrep);
    });

    it('falls back to Everstake when the option belongs to another account', () => {
        const state = createState({
            stake: { votingDelegation: { accountKey: otherAccountKey, option: anotherDrep } },
        });

        expect(selectVotingDelegationOption(state, accountKey)).toBe(DEFAULT_VOTING_OPTION);
    });
});

describe('selectStakeVotingDelegation', () => {
    it('returns the confirmed selection as stored, for prepareTxPlan to accept or reject', () => {
        const votingDelegation: AccountVotingDelegation = {
            accountKey: mockAccountKey({ descriptor: 'a' }),
            option: { type: 'current' },
        };

        expect(selectStakeVotingDelegation(createState({ stake: { votingDelegation } }))).toBe(
            votingDelegation,
        );
    });

    it('returns undefined when nothing was confirmed', () => {
        expect(selectStakeVotingDelegation(createState())).toBeUndefined();
    });
});

describe('selectStakeAccount', () => {
    const adaAccount = mockWalletAccount({
        symbol: asNetworkSymbol('ada'),
        descriptor: asAccountDescriptor('ada1'),
    });
    const otherAccount = mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor('eth1'),
    });
    const accounts = [adaAccount, otherAccount];

    it('returns the account the transaction in review was composed for', () => {
        const state = createState({ stake: { accountKey: adaAccount.key }, accounts });

        expect(selectStakeAccount(state)).toBe(adaAccount);
    });

    it('returns undefined when no transaction is in review', () => {
        expect(selectStakeAccount(createState({ accounts }))).toBeUndefined();
    });

    it('returns undefined when the account is no longer known', () => {
        const state = createState({
            stake: { accountKey: mockAccountKey({ descriptor: 'gone' }) },
            accounts,
        });

        expect(selectStakeAccount(state)).toBeUndefined();
    });
});
