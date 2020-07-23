import React from 'react';
import styled from 'styled-components';
import { Dropdown } from '@trezor/components';
import { Translation, ExternalLink, AppNavigationPanel, AppNavigation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { SUPPORT_URL } from '@suite-constants/urls';

const StyledLink = styled(ExternalLink)`
    padding: 10px 16px;
    width: 100%;
`;

const SettingsMenu = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    return (
        <AppNavigationPanel
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
                            ],
                        },
                    ]}
                />
            }
        />
    );
};

export default SettingsMenu;
