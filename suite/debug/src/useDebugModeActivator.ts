import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectIsDebugModeActive, suiteSettingsActions } from '@suite/settings';
import { desktopApi } from '@trezor/suite-desktop-api';

const DEBUG_MODE_ACTIVATION_CLICK_COUNT = 5;

export const useDebugModeActivator = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();
    const [clickCounter, setClickCounter] = useState(0);

    return useCallback(() => {
        const nextClickCounter = clickCounter + 1;

        if (nextClickCounter < DEBUG_MODE_ACTIVATION_CLICK_COUNT) {
            setClickCounter(nextClickCounter);

            return;
        }

        setClickCounter(0);

        const shouldEnableDebugMode = !isDebugModeActive;

        dispatch(suiteSettingsActions.setDebugMode({ showDebugMenu: shouldEnableDebugMode }));

        if (desktopApi.available) {
            desktopApi.configLogger(
                shouldEnableDebugMode
                    ? {
                          level: 'debug',
                          options: {
                              writeToDisk: true,
                          },
                      }
                    : {},
            );
        }
    }, [clickCounter, dispatch, isDebugModeActive]);
};
