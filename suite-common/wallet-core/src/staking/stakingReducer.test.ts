import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { type AccountVotingDelegation, stakeActions } from './stakingActions';
import { DEFAULT_VOTING_OPTION } from './stakingConstants';
import { prepareStakeReducer, stakeInitialState } from './stakingReducer';
import type { StakeState } from './stakingReducerTypes';

const stakeReducer = prepareStakeReducer(undefined);

const ACCOUNT_KEY = 'ada-account-key' as AccountKey;
const OTHER_ACCOUNT_KEY = 'other-ada-account-key' as AccountKey;

const anotherDrep: AccountVotingDelegation = {
    accountKey: ACCOUNT_KEY,
    option: { type: 'another_drep', drepId: 'drep1abc' },
};

const stateWith = (votingDelegation?: AccountVotingDelegation): StakeState => ({
    ...stakeInitialState,
    votingDelegation,
});

describe('stakeReducer voting delegation', () => {
    it('stores the option together with the account it was confirmed for', () => {
        const state = stakeReducer(
            stakeInitialState,
            stakeActions.setAccountVotingDelegation(anotherDrep),
        );

        expect(state.votingDelegation).toEqual(anotherDrep);
    });

    it('replaces a selection confirmed for another account', () => {
        const state = stakeReducer(
            stateWith({ accountKey: OTHER_ACCOUNT_KEY, option: DEFAULT_VOTING_OPTION }),
            stakeActions.setAccountVotingDelegation(anotherDrep),
        );

        expect(state.votingDelegation).toEqual(anotherDrep);
    });

    it('drops the selection when it is cleared', () => {
        const state = stakeReducer(
            stateWith(anotherDrep),
            stakeActions.clearAccountVotingDelegation(),
        );

        expect(state.votingDelegation).toBeUndefined();
    });

    it('keeps the selection on dispose, so backing out of the review modal does not discard it', () => {
        const state = stakeReducer(
            {
                ...stateWith(anotherDrep),
                serializedTx: { tx: 'tx', symbol: asNetworkSymbol('ada') },
            },
            stakeActions.dispose(),
        );

        expect(state.votingDelegation).toEqual(anotherDrep);
        expect(state.serializedTx).toBeUndefined();
    });
});
