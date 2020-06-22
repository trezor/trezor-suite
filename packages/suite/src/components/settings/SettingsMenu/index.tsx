import React from 'react';

import { Link, Dropdown } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import { Translation } from '@suite-components/Translation';

import { SUPPORT_URL } from '@suite-constants/urls';
import { TopNavigationPanel, AppNavigation } from '@suite-components';
import { useActions } from '@suite-hooks';

const SettingsMenu = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    return (
        <TopNavigationPanel
            title="Settings"
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
                    items={[
                        {
                            label: (
                                <Link variant="nostyle" href={SUPPORT_URL}>
                                    <Translation id="TR_SUPPORT" />
                                </Link>
                            ),
                            'data-test': '@settings/menu/support',
                            callback: () => {},
                        },
                        {
                            label: <Translation id="TR_SHOW_LOG" />,
                            'data-test': '@settings/menu/log',
                            callback: () => openModal({ type: 'log' }),
                        },
                    ]}
                />
            }
        />
    );
};

export default SettingsMenu;
