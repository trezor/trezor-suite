import { openModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';

import { MODULE_PREFIX } from './sendThunksConsts';

export const RBF_ERROR_ALREADY_MINED = 'replace-by-fee-error-transaction-already-mined';

export const replaceByFeeErrorThunk = createThunk(
    `${MODULE_PREFIX}/replaceByFeeErrorThunk`,
    (_, { dispatch }) => {
        TrezorConnect.cancel(RBF_ERROR_ALREADY_MINED);

        dispatch(
            openModal({
                type: 'review-transaction-rbf-previous-transaction-mined-error',
            }),
        );
    },
);
