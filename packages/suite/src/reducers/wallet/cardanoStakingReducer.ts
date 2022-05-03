import produce from 'immer';
import { CARDANO_STAKING } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';
import BigNumber from 'bignumber.js';
import { PendingStakeTx, PoolsResponse } from '@wallet-types/cardanoStaking';

export interface State {
    pendingTx: PendingStakeTx[];
    trezorPools: PoolsResponse | undefined;
    isFetchLoading: boolean;
    isFetchError: boolean;
}

export const initialState: State = {
    pendingTx: [],
    trezorPools: undefined,
    isFetchLoading: false,
    isFetchError: false,
};

const add = (state: State, payload: PendingStakeTx) => {
    state.pendingTx.push(payload);
};

const remove = (state: State, accountKey: string) => {
    const index = state.pendingTx.findIndex(tx => tx.accountKey === accountKey);
    state.pendingTx.splice(index, 1);
};

const setTrezorPools = (state: State, trezorPools: PoolsResponse) => {
    // sorted from least saturated to most
    trezorPools.pools.sort((a, b) => new BigNumber(a.live_stake).comparedTo(b.live_stake));
    state.trezorPools = trezorPools;
};

const setLoading = (state: State, isLoading: boolean) => {
    state.isFetchLoading = isLoading;
};

const setError = (state: State, isError: boolean) => {
    state.isFetchError = isError;
};

const cardanoStakingReducer = (state: State = initialState, action: WalletAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case CARDANO_STAKING.ADD_PENDING_STAKE_TX:
                return add(draft, action.pendingStakeTx);
            case CARDANO_STAKING.REMOVE_PENDING_STAKE_TX:
                return remove(draft, action.accountKey);
            case CARDANO_STAKING.SET_TREZOR_POOLS:
                return setTrezorPools(draft, action.trezorPools);
            case CARDANO_STAKING.SET_FETCH_LOADING:
                return setLoading(draft, action.loading);
            case CARDANO_STAKING.SET_FETCH_ERROR:
                return setError(draft, action.error);

            // no default
        }
    });

export default cardanoStakingReducer;
