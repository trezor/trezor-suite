import { Dispatch, GetState } from '@suite-types/index';
import { ACCOUNT } from './constants';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: any }
    | { type: typeof ACCOUNT.UPDATE; payload: any };

export const create = () => async (_dispatch: Dispatch, _getState: GetState): Promise<void> => {};
