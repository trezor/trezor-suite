import { createThunk } from '@suite-common/redux-utils/';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';

import { THP_PREFIX, thpActions } from './thpActions';

/**
 * Finish THP Autoconnect flow and start discovery.
 * Discovery middleware delays discovery until THP AutoConnect modal is closed.
 * TODO: implementation on mobile?
 */
export const finishThpAutoconnectThunk = createThunk<void, void, void>(
    `${THP_PREFIX}/finishThpAutoconnectThunk`,
    (_, { dispatch }) => {
        dispatch(thpActions.finishThpFlow());
        dispatch(startOrRestartDiscoveryThunk());
    },
);
