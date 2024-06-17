import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Timestamp, StakeFormState, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { cloneObject } from '@trezor/utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { stakeActions } from './stakeActions';
import { ValidatorsQueue } from './stakeTypes';
import { fetchEverstakeData } from './stakeThunks';
import { SerializedTx } from '../send/sendFormTypes';

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    serializedTx?: SerializedTx; // payload for TrezorConnect.pushTransaction
    data: {
        [key in NetworkSymbol]?: {
            poolStats: {
                error: boolean | string;
                isLoading: boolean;
                lastSuccessfulFetchTimestamp: Timestamp;
                data: {
                    ethApy?: number;
                    nextRewardPayout?: number;
                    isPoolStatsLoading?: boolean;
                };
            };
            validatorsQueue: {
                error: boolean | string;
                isLoading: boolean;
                lastSuccessfulFetchTimestamp: Timestamp;
                data: ValidatorsQueue;
            };
        };
    };
}

export type StakeRootState = { wallet: { stake: StakeState } };

export const stakeInitialState: StakeState = {
    precomposedTx: undefined,
    serializedTx: undefined,
    data: {},
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
                state.serializedTx = action.payload;
            } else {
                delete state.serializedTx;
            }
        })
        .addCase(stakeActions.dispose, state => {
            delete state.precomposedTx;
            delete state.precomposedForm;
            delete state.serializedTx;
        })
        .addCase(fetchEverstakeData.pending, (state, action) => {
            const { networkSymbol } = action.meta.arg;

            if (!state.data[networkSymbol]) {
                state.data[networkSymbol] = {
                    poolStats: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: {},
                    },
                    validatorsQueue: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: {},
                    },
                };
            }
        })
        .addCase(fetchEverstakeData.fulfilled, (state, action) => {
            const { networkSymbol, endpointType } = action.meta.arg;

            const data = state.data[networkSymbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    data: action.payload,
                };
            }
        })
        .addCase(fetchEverstakeData.rejected, (state, action) => {
            const { networkSymbol, endpointType } = action.meta.arg;

            const data = state.data[networkSymbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: {},
                };
            }
        });
});

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    state.wallet.stake.precomposedForm;
