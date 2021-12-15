import React, { useState } from 'react';
import styled from 'styled-components';
import { Dropdown, variables } from '@trezor/components';
import {
    CloseButton,
    Translation,
    TrezorLink,
    AppNavigationPanel,
    AppNavigation,
} from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { SUPPORT_URL } from '@suite-constants/urls';
import { getNumberFromPxString } from '@suite-utils/string';

const StyledLink = styled(TrezorLink)`
    padding: 10px 16px;
    width: 100%;
`;

const SettingsMenu = () => {
    const { setDebugMode, openModal, goto } = useActions({
        openModal: modalActions.openModal,
        goto: routerActions.goto,
        setDebugMode: suiteActions.setDebugMode,
    });

    const { screenWidth, showDebugMenu, settingsBackRoute } = useSelector(state => ({
        screenWidth: state.resize.screenWidth,
        showDebugMenu: state.suite.settings.debug.showDebugMenu,
        settingsBackRoute: state.router.settingsBackRoute,
    }));

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState(0);

    return (
        <AppNavigationPanel
            maxWidth="small"
            title={
                <span
                    aria-hidden="true"
                    data-test="@settings/menu/title"
                    onClick={() => {
                        setClickCounter(prev => prev + 1);
                        if (clickCounter === 4) {
                            setClickCounter(0);
                            setDebugMode({ showDebugMenu: !showDebugMenu });
                        }
                    }}
                >
                    <Translation id="TR_SETTINGS" />
                </span>
            }
            navigation={
                <AppNavigation
                    maxWidth="default"
                    items={[
                        {
                            id: 'settings-index',
                            title: <Translation id="TR_GENERAL" />,
                            position: 'primary',
                            'data-test': '@settings/menu/general',
                            icon:
                                (screenWidth || 0) > getNumberFromPxString(variables.SCREEN_SIZE.SM)
                                    ? 'SETTINGS'
                                    : undefined,
                            callback: () => {
                                goto('settings-index', undefined, true);
                            },
                        },
                        {
                            id: 'settings-device',
                            title: <Translation id="TR_DEVICE" />,
                            position: 'primary',
                            'data-test': '@settings/menu/device',
                            icon:
                                (screenWidth || 0) > getNumberFromPxString(variables.SCREEN_SIZE.SM)
                                    ? 'TREZOR'
                                    : undefined,
                            callback: () => {
                                goto('settings-device', undefined, true);
                            },
                        },
                        {
                            id: 'settings-coins',
                            title: <Translation id="TR_COINS" />,
                            position: 'primary',
                            'data-test': '@settings/menu/wallet',
                            icon:
                                (screenWidth || 0) > getNumberFromPxString(variables.SCREEN_SIZE.SM)
                                    ? 'COINS'
                                    : undefined,
                            callback: () => {
                                goto('settings-coins', undefined, true);
                            },
                        },
                    ]}
                />
            }
            titleContent={
                <>
                    <Dropdown
                        alignMenu="right"
                        data-test="@settings/menu/dropdown"
                        items={[
                            {
                                key: 'group1',
                                options: [
                                    {
                                        key: 'support',
                                        label: (
                                            <StyledLink
                                                icon="EXTERNAL_LINK"
                                                size="small"
                                                href={SUPPORT_URL}
                                            >
                                                <Translation id="TR_SUPPORT" />
                                            </StyledLink>
                                        ),
                                        'data-test': '@settings/menu/support',
                                        callback: () => {},
                                        noPadding: true,
                                    },
                                    {
                                        key: 'log',
                                        label: <Translation id="TR_SHOW_LOG" />,
                                        'data-test': '@settings/menu/log',
                                        callback: () => {
                                            openModal({ type: 'log' });
                                        },
                                    },
                                    {
                                        key: 'debug',
                                        label: <Translation id="TR_DEBUG_SETTINGS" />,
                                        'data-test': '@settings/menu/debug',
                                        isHidden: !showDebugMenu,
                                        callback: () => {
                                            goto('settings-debug');
                                        },
                                    },
                                ],
                            },
                        ]}
                    />
                    <CloseButton
                        onClick={() => goto(settingsBackRoute.name, settingsBackRoute.params)}
                    />
                </>
            }
        />
    );
};

export default SettingsMenu;
