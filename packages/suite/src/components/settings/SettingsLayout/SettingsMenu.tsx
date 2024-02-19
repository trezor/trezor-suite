import { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { CloseButton, Translation, AppNavigationPanel, AppNavigation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { FADE_IN } from '@trezor/components/src/config/animations';
import { NavigationItem } from 'src/components/suite/AppNavigation/AppNavigation';
import { desktopApi } from '@trezor/suite-desktop-api';
import { selectIsLoggedOut } from 'src/reducers/suite/suiteReducer';

const CloseButtonWrapper = styled.div<{ isAppNavigationPanelInView?: boolean }>`
    position: absolute;
    right: 0;
    top: ${({ isAppNavigationPanelInView }) => (isAppNavigationPanelInView ? 0 : '-10px')};
    display: flex;
    justify-content: flex-end;
`;

const CloseButtonSticky = styled(CloseButton)<{ isAppNavigationPanelInView?: boolean }>`
    ${({ isAppNavigationPanelInView }) =>
        !isAppNavigationPanelInView &&
        css`
            animation: ${FADE_IN} 0.5s;
            position: fixed;
        `}
`;
export const SettingsMenu = () => {
    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);

    const settingsBackRoute = useSelector(state => state.router.settingsBackRoute);
    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);
    const initialRun = useSelector(state => state.suite.flags.initialRun);
    const isLoggedOut = useSelector(selectIsLoggedOut);

    const dispatch = useDispatch();

    const handleTitleClick = () => {
        setClickCounter(prev => prev + 1);

        if (clickCounter === 4) {
            setClickCounter(0);
            dispatch(setDebugMode({ showDebugMenu: !showDebugMenu }));
            if (desktopApi.available) {
                desktopApi.configLogger(
                    showDebugMenu
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
    const handleClose = () =>
        dispatch(
            goto(initialRun ? 'suite-start' : settingsBackRoute.name, {
                params: settingsBackRoute.params,
            }),
        );

    const appNavItems = useMemo<Array<NavigationItem>>(
        () => [
            {
                id: 'settings-index',
                title: <Translation id="TR_GENERAL" />,
                position: 'primary',
                'data-test-id': '@settings/menu/general',
                callback: () => dispatch(goto('settings-index', { preserveParams: true })),
            },
            {
                id: 'settings-device',
                title: <Translation id="TR_DEVICE" />,
                position: 'primary',
                'data-test-id': '@settings/menu/device',
                callback: () => dispatch(goto('settings-device', { preserveParams: true })),
            },
            {
                id: 'settings-coins',
                title: <Translation id="TR_COINS" />,
                position: 'primary',
                'data-test-id': '@settings/menu/wallet',
                callback: () => dispatch(goto('settings-coins', { preserveParams: true })),
            },
            {
                id: 'settings-debug',
                title: <Translation id="TR_DEBUG_SETTINGS" />,
                position: 'primary',
                isHidden: !showDebugMenu,
                'data-test-id': '@settings/menu/debug',
                callback: () => dispatch(goto('settings-debug', { preserveParams: true })),
            },
        ],
        [dispatch, showDebugMenu],
    );

    return (
        <AppNavigationPanel
            title={
                <span
                    aria-hidden="true"
                    data-test-id="@settings/menu/title"
                    onClick={handleTitleClick}
                >
                    <Translation id="TR_SETTINGS" />
                </span>
            }
            navigation={<AppNavigation items={appNavItems} />}
            titleContent={isAppNavigationPanelInView =>
                isLoggedOut && (
                    <CloseButtonWrapper isAppNavigationPanelInView={isAppNavigationPanelInView}>
                        <CloseButtonSticky
                            isAppNavigationPanelInView={isAppNavigationPanelInView}
                            onClick={handleClose}
                            data-test-id="@settings/menu/close"
                        />
                    </CloseButtonWrapper>
                )
            }
        />
    );
};
