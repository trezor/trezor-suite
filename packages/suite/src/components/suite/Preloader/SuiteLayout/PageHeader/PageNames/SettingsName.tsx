import { useState } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { HeaderHeading, BasicNameProps } from './BasicName';

export const SettingsName = ({ nameId }: BasicNameProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);

    const dispatch = useDispatch();

    const handleTitleClick = () => {
        setClickCounter(prev => prev + 1);

        if (clickCounter === 4) {
            setClickCounter(0);
            dispatch(setDebugMode({ showDebugMenu: !isDebugModeActive }));

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
        <HeaderHeading onClick={handleTitleClick}>
            <Translation id={nameId} />
        </HeaderHeading>
    );
};
