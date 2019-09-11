import { Dispatch, GetState } from '@suite-types/index';
import { ACCOUNT } from '@wallet-actions/constants';
import { Account } from '@wallet-types';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.UPDATE; payload: Account };

export const create = () => async (_dispatch: Dispatch, _getState: GetState): Promise<void> => {};
