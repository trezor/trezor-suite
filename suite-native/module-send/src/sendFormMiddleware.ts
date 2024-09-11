import { createMiddleware } from '@suite-common/redux-utils';
import { setBitcoinUnits } from '@suite-native/settings';

import { removeSendFormDraftsSupportingAmountUnitThunk } from './sendFormThunks';

export const sendFormMiddleware = createMiddleware((action, { next, dispatch }) => {
    // The action has to be handled by the reducer first since we expect updated state.
    next(action);

    if (setBitcoinUnits.match(action)) {
        dispatch(removeSendFormDraftsSupportingAmountUnitThunk());
    }

    return action;
});
