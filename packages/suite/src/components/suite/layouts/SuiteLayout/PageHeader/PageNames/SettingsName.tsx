import { useState } from 'react';
import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacingsPx } from '@trezor/theme';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { HeaderHeading } from './BasicName';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
`;

export const SettingsName = () => {
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
        <Container>
            <HeaderHeading onClick={handleTitleClick} data-testid="@settings/menu/title">
                <Translation id="TR_SETTINGS" />
            </HeaderHeading>
        </Container>
    );
};
