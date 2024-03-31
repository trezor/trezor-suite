import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { initStakeDataThunk } from './stakeThunks';

const CHANGE_NETWORKS = '@wallet-settings/change-networks'; // from walletSettings.ts

export const prepareStakeMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next }) => {
        next(action);

        if (action.type === CHANGE_NETWORKS) {
            dispatch(initStakeDataThunk());
        }

        return action;
    },
);
