import { createThunk } from '@suite-common/redux-utils/';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { DeviceUniquePath } from '@trezor/connect';

import { THP_PREFIX, thpActions } from './thpActions';

type FinishThpAutoconnectThunkParams = {
    path: DeviceUniquePath;
};

/**
 * Finish THP Autoconnect flow and start discovery.
 * Discovery middleware delays discovery until THP AutoConnect modal is closed.
 * TODO: implementation on mobile?
 */
export const finishThpAutoconnectThunk = createThunk<void, FinishThpAutoconnectThunkParams, void>(
    `${THP_PREFIX}/finishThpAutoconnectThunk`,
    ({ path }, { dispatch }) => {
        dispatch(thpActions.finishThpFlow({ path }));
        dispatch(startOrRestartDiscoveryThunk());
    },
);
