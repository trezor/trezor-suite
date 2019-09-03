import { Dispatch, GetState } from '@suite-types/index';
import { ACCOUNT } from './constants';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: any } // TODO types
    | { type: typeof ACCOUNT.UPDATE; payload: any }; // TODO types

export const create = () => async (_dispatch: Dispatch, _getState: GetState): Promise<void> => {};
