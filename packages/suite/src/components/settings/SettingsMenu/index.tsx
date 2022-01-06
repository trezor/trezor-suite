import React, { useState } from 'react';
import { CloseButton, Translation, AppNavigationPanel, AppNavigation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const SettingsMenu = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const { settingsBackRoute } = useSelector(state => ({
        settingsBackRoute: state.router.settingsBackRoute,
    }));

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);
    const [showDebugSettings, setShowDebugSettings] = useState<boolean>(false);

    return (
        <AppNavigationPanel
            maxWidth="small"
            title={
                <span
                    aria-hidden="true"
                    onClick={() => {
                        setClickCounter(prev => prev + 1);
                        if (clickCounter === 4) {
                            setClickCounter(0);
                            setShowDebugSettings(!showDebugSettings);
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
                                goto('settings-index', undefined, true);
                            },
                        },
                        {
                            id: 'settings-device',
                            title: <Translation id="TR_DEVICE" />,
                            position: 'primary',
                            'data-test': '@settings/menu/device',
                            callback: () => {
                                goto('settings-device', undefined, true);
                            },
                        },
                        {
                            id: 'settings-coins',
                            title: <Translation id="TR_COINS" />,
                            position: 'primary',
                            'data-test': '@settings/menu/wallet',
                            callback: () => {
                                goto('settings-coins', undefined, true);
                            },
                        },
                        {
                            id: 'settings-debug',
                            title: <Translation id="TR_DEBUG_SETTINGS" />,
                            position: 'primary',
                            isHidden: !showDebugSettings,
                            'data-test': '@settings/menu/debug',
                            callback: () => {
                                goto('settings-debug', undefined, true);
                            },
                        },
                    ]}
                />
            }
            titleContent={
                <CloseButton
                    onClick={() => goto(settingsBackRoute.name, settingsBackRoute.params)}
                    data-test="@settings/menu/close"
                />
            }
        />
    );
};

export default SettingsMenu;
