import React, { useState } from 'react';

import { CloseButton, Translation, AppNavigationPanel, AppNavigation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';

const SettingsMenu = () => {
    const { setDebugMode, goto } = useActions({
        goto: routerActions.goto,
        setDebugMode: suiteActions.setDebugMode,
    });

    const { settingsBackRoute, showDebugMenu } = useSelector(state => ({
        settingsBackRoute: state.router.settingsBackRoute,
        showDebugMenu: state.suite.settings.debug.showDebugMenu,
    }));

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);

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
                            callback: () => {
                                goto('settings-index', { preserveParams: true });
                            },
                        },
                        {
                            id: 'settings-device',
                            title: <Translation id="TR_DEVICE" />,
                            position: 'primary',
                            'data-test': '@settings/menu/device',
                            callback: () => {
                                goto('settings-device', { preserveParams: true });
                            },
                        },
                        {
                            id: 'settings-coins',
                            title: <Translation id="TR_COINS" />,
                            position: 'primary',
                            'data-test': '@settings/menu/wallet',
                            callback: () => {
                                goto('settings-coins', { preserveParams: true });
                            },
                        },
                        {
                            id: 'settings-debug',
                            title: <Translation id="TR_DEBUG_SETTINGS" />,
                            position: 'primary',
                            isHidden: !showDebugMenu,
                            'data-test': '@settings/menu/debug',
                            callback: () => {
                                goto('settings-debug', { preserveParams: true });
                            },
                        },
                    ]}
                />
            }
            titleContent={
                <CloseButton
                    onClick={() =>
                        goto(settingsBackRoute.name, { params: settingsBackRoute.params })
                    }
                    data-test="@settings/menu/close"
                />
            }
        />
    );
};

export default SettingsMenu;
