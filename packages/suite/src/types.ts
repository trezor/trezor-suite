import { RouterActions } from './actions/RouterActions';
import { ThunkDispatch } from 'redux-thunk';
import { UiEvent, TransportEvent } from 'trezor-connect';

import { StorageActions } from './actions/StorageActions';
import { SuiteActions } from './actions/SuiteActions';
import { State as ReducersState } from './reducers/store';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type TrezorConnectEvents = Omit<TransportEvent, 'event'> | Omit<UiEvent, 'event'>;

export type State = ReducersState;
export type Action = TrezorConnectEvents | RouterActions | StorageActions | SuiteActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<State, any, Action>;
export type GetState = () => State;
