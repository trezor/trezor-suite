import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/redux-utils';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export const useToggleSuiteSyncMethods = () => {
    const dispatch = useDispatch();
    const { suiteSync } = useServices();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const disableSuiteSyncIfNeeded = () => {
        if (isSuiteSyncEnabled) {
            dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));
            suiteSync.turnOffSuiteSync();
        }
    };

    const enableSuiteSyncIfNeeded = () => {
        if (!isSuiteSyncEnabled) {
            dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));
        }
    };

    return {
        disableSuiteSyncIfNeeded,
        enableSuiteSyncIfNeeded,
    };
};
