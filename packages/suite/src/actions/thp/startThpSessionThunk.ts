import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils/';
import TrezorConnect from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

export const startThpSessionThunk = createThunk<void, void, void>(
    `${THP_PREFIX}/startThpSessionThunk`,
    (_, { getState }) => {
        const device = selectSelectedDevice(getState() as any);
        if (!device) return;
        TrezorConnect.uiResponse({
            type: 'ui-receive_confirmation',
            payload: true,
            device: { path: device.path },
        });
    },
);
