import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    EverstakeStakingInfo,
    PrecomposedTransactionFinal,
    StakeFormState,
    Timestamp,
} from '@suite-common/wallet-types';
import { cloneObject, isSafeObjectKey } from '@trezor/utils';

import {
    EthereumValidatorsQueue,
    SolanaStakeRewardsByAccount,
    SolanaTotalStakeRewardsByAccount,
} from './api/types';
import { VotingDelegationOption, stakeActions } from './stakeActions';
import {
    fetchEverstakeData,
    fetchEverstakeRewards,
    fetchEverstakeStakingInfo,
} from './stakeThunks';
import { SerializedTx } from '../send/sendFormTypes';

type ApiRequest<T> = {
    error: boolean | string;
    isLoading: boolean;
    lastSuccessfulFetchTimestamp: Timestamp;
    data: T | null;
};

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    serializedTx?: SerializedTx; // payload for TrezorConnect.pushTransaction
    votingDelegation: VotingDelegationOption;
    data: {
        [key in NetworkSymbol]?: {
            poolStats?: ApiRequest<{
                ethApy: number;
                nextRewardPayout: number;
            }>;
            validatorsQueue?: ApiRequest<EthereumValidatorsQueue>;
            stakingInfo?: ApiRequest<EverstakeStakingInfo>;
            stakingRewards?: ApiRequest<{
                rewardsHistory: SolanaStakeRewardsByAccount;
                totalRewards: SolanaTotalStakeRewardsByAccount;
            }>;
        };
    };
}

export type StakeRootState = { wallet: { stake: StakeState } };

export const stakeInitialState: StakeState = {
    precomposedTx: undefined,
    serializedTx: undefined,
    data: {},
    votingDelegation: { type: 'everstake' },
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
        .addCase(fetchEverstakeData.pending, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            if (!state.data[symbol]) {
                state.data[symbol] = {};
            }

            if (!state.data[symbol][endpointType]) {
                state.data[symbol][endpointType] = {
                    error: false,
                    isLoading: true,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                };
            } else {
                state.data[symbol][endpointType].isLoading = true;
                state.data[symbol][endpointType].error = false;
            }
        })
        .addCase(fetchEverstakeData.fulfilled, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    // @ts-expect-error - TODO: we would have to refactor the whole reducer. The current structure doesn't make much sense, only speficic symbols have specific data type, it doesn't apply that all symbols can have all data types.
                    data: action.payload,
                };
            }
        })
        .addCase(fetchEverstakeData.rejected, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                };
            }
        })
        .addCase(fetchEverstakeStakingInfo.pending, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            if (!state.data[symbol]) {
                state.data[symbol] = {};
            }

            if (!state.data[symbol][endpointType]) {
                state.data[symbol] = {
                    ...state.data[symbol],
                    stakingInfo: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                };
            } else {
                state.data[symbol][endpointType].isLoading = true;
                state.data[symbol][endpointType].error = false;
            }
        })
        .addCase(fetchEverstakeStakingInfo.fulfilled, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    data: action.payload,
                };
            }
        })
        .addCase(fetchEverstakeStakingInfo.rejected, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                };
            }
        })
        .addCase(fetchEverstakeRewards.pending, (state, action) => {
            const { symbol, endpointType, address } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol]?.[endpointType]?.data;

            if (!data?.totalRewards?.[address] || !data.rewardsHistory?.[address]) {
                state.data[symbol] = {
                    ...state.data[symbol],
                    stakingRewards: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                };
            }
        })
        .addCase(fetchEverstakeRewards.fulfilled, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    data: action.payload,
                };
            }
        })

        .addCase(fetchEverstakeRewards.rejected, (state, action) => {
            const { symbol, endpointType } = action.meta.arg;

            if (!isSafeObjectKey(endpointType)) {
                return;
            }

            const data = state.data[symbol];

            if (data?.[endpointType]) {
                data[endpointType] = {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                };
            }
        });
});

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    state.wallet.stake.precomposedForm;
