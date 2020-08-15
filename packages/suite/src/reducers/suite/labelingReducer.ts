// import produce from 'immer';
// import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface State {
    [key: string]: string;
}

// todo: this is probably deprecated
export const initialState: State = {
    tb1q2ewuctpf5y3jfr34pnp9pv9tfw0hswnk7rlcws: 'My labeled address',
    bc1qp89escs0slwnl0zls5pjgeg9fwu63kgepsrzql: 'Matej 1',
    bc1q4dur587hz7u37msq04r8d06g6nrlvk6jzdqmm3: 'Matej 2',
    bc1q9ltgafgguzasryvzwmgh47zw3rk3jerksq9atp: 'Matej 3',
};

export default (state: State = initialState, _action: Action): State => {
    // return produce(state, draft => {
    //     switch (action.type) {
    //         case LOG.ADD:
    //             draft.entries = state.entries.concat([action.payload]);
    //             break;
    //         // no default
    //     }
    // });
    return state;
};
