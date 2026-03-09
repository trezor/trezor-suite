import { createMiddleware } from '@suite-common/redux-utils';
import { UI_REQUEST } from '@trezor/connect';

import { recoveryActions } from './recoveryReducer';
import { selectRecoveryStatus } from './recoverySelectors';

export const recoveryMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    next(action);

    if (
        action.type === UI_REQUEST.REQUEST_WORD &&
        selectRecoveryStatus(getState()) === 'waiting-for-confirmation'
    ) {
        // Since the device asked for a first word, we can safely assume we've received confirmation from the user
        dispatch(recoveryActions.setStatus('in-progress'));
    }

    return action;
});
