import produce from 'immer';
import { CARDANO_STAKING } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';
import { PendingStakeTx } from '@wallet-types/cardanoStaking';

export interface State {
    pendingTx: PendingStakeTx[];
}

export const initialState: State = {
    pendingTx: [],
};

const add = (state: State, payload: PendingStakeTx) => {
    state.pendingTx.push(payload);
};
const remove = (state: State, accountKey: string) => {
    const index = state.pendingTx.findIndex(tx => tx.accountKey === accountKey);
    state.pendingTx.splice(index, 1);
};

const cardanoStakingReducer = (state: State = initialState, action: WalletAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case CARDANO_STAKING.ADD_PENDING_STAKE_TX:
                return add(draft, action.pendingStakeTx);
            case CARDANO_STAKING.REMOVE_PENDING_STAKE_TX:
                return remove(draft, action.accountKey);
            // no default
        }
    });

export default cardanoStakingReducer;
