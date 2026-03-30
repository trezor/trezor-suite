import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { cloneObject } from '@trezor/utils';

import { stakeActions } from './stakeActions';
import { stakeDataSlice } from './stakeDataSlice';
import type { StakeState } from './stakeReducerTypes';

export const stakeInitialState: StakeState = {
    precomposedTx: undefined,
    serializedTx: undefined,
    votingDelegation: { type: 'everstake' },
    data: stakeDataSlice.getInitialState(),
};

export const prepareStakeReducer = createReducerWithExtraDeps(stakeInitialState, builder => {
    builder
        .addCase(stakeActions.requestSignTransaction, (state, action) => {
            if (action.payload) {
                state.precomposedTx = {
                    ...action.payload.transactionInfo,
                    createdTimestamp: new Date().getTime(),
                };
                // Deep-cloning to prevent buggy interaction between react-hook-form and immer, see https://github.com/orgs/react-hook-form/discussions/3715#discussioncomment-2151458
                // Otherwise, whenever the outputs fieldArray is updated after the form draft or precomposedForm is saved, there is na error:
                // TypeError: Cannot assign to read only property of object '#<Object>'
                // This might not be necessary in the future when the dependencies are upgraded.
                state.precomposedForm = cloneObject(action.payload.formValues);
            } else {
                delete state.precomposedTx;
                delete state.precomposedForm;
            }
        })
        .addCase(stakeActions.requestPushTransaction, (state, action) => {
            if (action.payload) {
                state.serializedTx = action.payload;
            } else {
                delete state.serializedTx;
            }
        })
        .addCase(stakeActions.setVotingDelegationOption, (state, action) => {
            state.votingDelegation = action.payload;
        })
        .addCase(stakeActions.dispose, state => {
            delete state.precomposedTx;
            delete state.precomposedForm;
            delete state.serializedTx;
        })
        .addDefaultCase((state, action) => {
            state.data = stakeDataSlice.reducer(state.data, action);
        });
});

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    state.wallet.stake.precomposedForm;

export const selectStakePrecomposedTx = (state: StakeRootState) => state.wallet.stake.precomposedTx;
