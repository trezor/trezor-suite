import { RouterActions } from './actions/RouterActions';
import { StorageActions } from './actions/StorageActions';
import { SuiteActions } from './actions/SuiteActions';
import { State as ReducersState } from './reducers/store';
import { ThunkDispatch } from 'redux-thunk';

export type State = ReducersState;
export type Action = RouterActions | StorageActions | SuiteActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<State, any, Action>;
export type GetState = () => State;
