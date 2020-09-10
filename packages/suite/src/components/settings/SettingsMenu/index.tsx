import React, { useState } from 'react';
import styled from 'styled-components';
import { Dropdown } from '@trezor/components';
import { Translation, ExternalLink, AppNavigationPanel, AppNavigation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { SUPPORT_URL } from '@suite-constants/urls';

const StyledLink = styled(ExternalLink)`
    padding: 10px 16px;
    width: 100%;
`;

const SettingsMenu = () => {
    const { setDebugMode, openModal, goto } = useActions({
        openModal: modalActions.openModal,
        goto: routerActions.goto,
        setDebugMode: suiteActions.setDebugMode,
    });

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState(0);
    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);

    return (
        <AppNavigationPanel
            title={
                <span
                    aria-hidden="true"
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
                    items={[
                        {
                            title: <Translation id="TR_GENERAL" />,
                            'data-test': '@settings/menu/general',
                            icon: 'SETTINGS',
                            route: 'settings-index',
                        },
                        {
                            title: <Translation id="TR_DEVICE" />,
                            'data-test': '@settings/menu/device',
                            icon: 'TREZOR',
                            route: 'settings-device',
                        },
                        {
                            title: <Translation id="TR_COINS" />,
                            'data-test': '@settings/menu/wallet',
                            icon: 'COINS',
                            route: 'settings-wallet',
                        },
                    ]}
                />
            }
            dropdown={
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
                                        <StyledLink size="small" href={SUPPORT_URL}>
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
                                    label: 'Debug Settings',
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
            }
        />
    );
};

export default SettingsMenu;
