import { createMiddleware } from '@suite-common/redux-utils';
import { WALLET_SETTINGS } from '@suite-common/wallet-core';

import { removeSendFormDraftsSupportingAmountUnitThunk } from './sendFormThunks';

export const sendFormMiddleware = createMiddleware((action, { next, dispatch }) => {
    // The action has to be handled by the reducer first since we expect updated state.
    next(action);

    if (action.type === WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS) {
        dispatch(removeSendFormDraftsSupportingAmountUnitThunk());
    }

    return action;
});
