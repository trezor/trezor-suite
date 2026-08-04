import { createThunk } from '@suite-common/redux-utils';
import { type ThpRootState, selectThpConfirmationRequestId } from '@suite-common/thp';
import TrezorConnect from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

export const startThpSessionThunk = createThunk<void, void, { state: ThpRootState }>(
    `${THP_PREFIX}/startThpSessionThunk`,
    (_, { getState }) => {
        const requestId = selectThpConfirmationRequestId(getState());
        TrezorConnect.uiResponse({ type: 'ui-receive_confirmation', payload: true, requestId });
    },
);
