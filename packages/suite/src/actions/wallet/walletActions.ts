import { WALLET } from './constants';
import { Dispatch, GetState } from '@suite-types';

export type WalletActions =
    | {
          type: typeof WALLET.INIT;
      }
    | {
          type: typeof WALLET.INIT_SUCCESS;
      }
    | {
          type: typeof WALLET.INIT_FAIL;
          error: string;
      };

export const init = () => (dispatch: Dispatch, getState: GetState) => {
    const { status } = getState().wallet;
    if (!status.loaded && !status.loading) {
        dispatch({
            type: WALLET.INIT,
        });
    }
};
