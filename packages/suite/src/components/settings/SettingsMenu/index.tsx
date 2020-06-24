import React from 'react';
import styled from 'styled-components';

import { Link, Dropdown } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import { Translation } from '@suite-components/Translation';

import { SUPPORT_URL } from '@suite-constants/urls';
import { TopNavigationPanel, AppNavigation } from '@suite-components';
import { useActions } from '@suite-hooks';

const StyledLink = styled(Link)`
    padding: 10px 16px;
    width: 100%;
`;

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
                    data-test="@settings/menu/dropdown"
                    items={[
                        {
                            label: (
                                <StyledLink variant="nostyle" href={SUPPORT_URL}>
                                    <Translation id="TR_SUPPORT" />
                                </StyledLink>
                            ),
                            'data-test': '@settings/menu/support',
                            callback: () => {},
                            noPadding: true,
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
