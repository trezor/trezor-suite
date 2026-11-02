import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';

import { DEFAULT_VOTING_OPTION } from './cardano/cardanoStakingConstants';
import { type AccountVotingDelegation } from './cardano/cardanoStakingTypes';
import { getStakeFormsDefaultValues } from './ethereum/ethereumStaking';
import { stakeActions } from './stakingActions';
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

describe('stakeReducer transaction review account', () => {
    const formValues: StakeFormState = {
        ...getStakeFormsDefaultValues({ address: 'addr1stake', stakeType: 'stake' }),
        options: ['broadcast'],
        setMaxOutputId: undefined,
    };
    const transactionInfo: PrecomposedTransactionFinal = {
        type: 'final',
        fee: '174301',
        feePerByte: '44',
        bytes: 300,
        totalSpent: '1174301',
        max: undefined,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    };

    const stateInReview = (): StakeState =>
        stakeReducer(
            stakeInitialState,
            stakeActions.requestSignTransaction({
                formValues,
                transactionInfo,
                accountKey: ACCOUNT_KEY,
            }),
        );

    it('remembers the account the transaction was composed for', () => {
        expect(stateInReview().accountKey).toBe(ACCOUNT_KEY);
    });

    it('forgets the account when signing is cancelled', () => {
        const state = stakeReducer(stateInReview(), stakeActions.requestSignTransaction());

        expect(state.accountKey).toBeUndefined();
    });

    it('forgets the account on dispose', () => {
        const state = stakeReducer(stateInReview(), stakeActions.dispose());

        expect(state.accountKey).toBeUndefined();
    });
});
