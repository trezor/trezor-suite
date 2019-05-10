import { RouterActions } from './actions/RouterActions';
import { SuiteActions } from './actions/SuiteActions';

export type Action = RouterActions | SuiteActions;
export { State } from './reducers/store';
