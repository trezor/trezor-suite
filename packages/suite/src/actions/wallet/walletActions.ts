// import { Dispatch, GetState } from '@suite-types/index';
import { WALLET } from './constants';

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

export const init = () => ({
    type: WALLET.INIT,
});
