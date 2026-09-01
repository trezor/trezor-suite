import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { selectIsDebugModeActive } from './debugSelectors';
import { debugActions } from './debugSlice';

const DEBUG_MODE_ACTIVATION_CLICK_COUNT = 5;

// Toggles debug mode and (on desktop) the debug-level logger. Shared by the "click the
// settings title 5×" activator and the keyboard shortcut.
export const useToggleDebugMode = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();

    return useCallback(() => {
        const shouldEnableDebugMode = !isDebugModeActive;

        dispatch(debugActions.setShowDebugMenu(shouldEnableDebugMode));

        if (desktopApi.available) {
            desktopApi.configLogger(
                shouldEnableDebugMode
                    ? {
                          level: 'debug',
                          writeToDisk: true,
                      }
                    : {},
            );
        }
    }, [dispatch, isDebugModeActive]);
};

export const useDebugModeActivator = () => {
    const toggleDebugMode = useToggleDebugMode();

    const [clickCounter, setClickCounter] = useState(0);

    return useCallback(() => {
        const nextClickCounter = clickCounter + 1;

        if (nextClickCounter < DEBUG_MODE_ACTIVATION_CLICK_COUNT) {
            setClickCounter(nextClickCounter);

            return;
        }

        setClickCounter(0);
        toggleDebugMode();
    }, [clickCounter, toggleDebugMode]);
};
