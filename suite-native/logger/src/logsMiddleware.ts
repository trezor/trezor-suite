import { createMiddleware } from '@suite-common/redux-utils';
import { setColorScheme, setOnboardingFinished } from '@suite-native/module-settings';
import { addLog } from '@suite-common/logger';

export const logsMiddleware = createMiddleware((action, { next, dispatch }) => {
    if (setOnboardingFinished.match(action)) {
        dispatch(addLog({ action, payload: { ...action } }));
    }

    if (setColorScheme.match(action)) {
        dispatch(addLog({ action, payload: { ...action } }));
    }

    return next(action);
});
