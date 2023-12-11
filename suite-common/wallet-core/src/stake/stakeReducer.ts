import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { StakeFormState, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { cloneObject } from '@trezor/utils';

import { stakeActions } from './stakeActions';

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    signedTx?: { tx: string; coin: string }; // payload for TrezorConnect.pushTransaction
}

export const stakeInitialState: StakeState = {
    precomposedTx: undefined,
    signedTx: undefined,
};

export type StakeRootState = {
    wallet: {
        stake: StakeState;
    };
};

export const prepareStakeReducer = createReducerWithExtraDeps(stakeInitialState, builder => {
    builder
        .addCase(stakeActions.requestSignTransaction, (state, action) => {
            if (action.payload) {
                state.precomposedTx = action.payload.transactionInfo;
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
                state.signedTx = action.payload;
            } else {
                delete state.signedTx;
            }
        })
        .addCase(stakeActions.dispose, state => {
            delete state.precomposedTx;
            delete state.precomposedForm;
            delete state.signedTx;
        });
});

export const selectStake = (state: StakeRootState) => state.wallet.stake;
