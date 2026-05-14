import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsDebugModeActive, suiteSettingsActions } from '@suite/settings';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { BasicName } from './BasicName';

export const SettingsName = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);

    const dispatch = useDispatch();

    const handleTitleClick = () => {
        setClickCounter(prev => prev + 1);

        if (clickCounter === 4) {
            setClickCounter(0);
            dispatch(suiteSettingsActions.setDebugMode({ showDebugMenu: !isDebugModeActive }));

            if (desktopApi.available) {
                desktopApi.configLogger(
                    isDebugModeActive
                        ? {} // Reset to default values.
                        : {
                              level: 'debug',
                              options: {
                                  writeToDisk: true,
                              },
                          },
                );
            }
        }
    };

    return (
        <BasicName onClick={handleTitleClick} data-testid="@settings/menu/title">
            <Translation id="TR_SETTINGS" />
        </BasicName>
    );
};
