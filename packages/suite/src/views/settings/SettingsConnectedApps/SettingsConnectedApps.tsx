import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Column, Icon, Row, SubTabs } from '@trezor/components';
import { TrezorLogoIcon, WalletConnectIcon } from '@trezor/icons';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const dispatch = useDispatch();

    const tabs = [
        {
            id: 'walletconnect',
            icon: WalletConnectIcon,
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
            isEnabled: true,
        },
        {
            id: 'trezor-connect',
            icon: TrezorLogoIcon,
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
            isEnabled: true,
        },
    ].filter(tab => tab.isEnabled);
    const [activeItemdId, setActiveItemId] = useState(tabs[0]?.id);

    useEffect(() => {
        if (tabs.length === 0) {
            dispatch(gotoThunk({ routeName: 'settings-index' }));
        }
    }, [tabs.length, dispatch]);

    return (
        <SettingsLayout>
            <Column gap={16} flex="1">
                <Row justifyContent="space-between" flexWrap="wrap" gap={12}>
                    <SubTabs size="large" activeItemId={activeItemdId}>
                        {tabs.map(tab => (
                            <SubTabs.Item
                                key={tab.id}
                                id={tab.id}
                                data-testid={`@settings/connect-apps/tabs/${tab.id}`}
                                onClick={() => setActiveItemId(tab.id)}
                            >
                                <Row alignItems="center" gap={8}>
                                    <Icon as={tab.icon} />
                                    {tab.title}
                                </Row>
                            </SubTabs.Item>
                        ))}
                    </SubTabs>
                    {activeItemdId === 'walletconnect' && <WalletConnectButton />}
                </Row>
                {tabs.find(tab => tab.id === activeItemdId)?.component}
            </Column>
        </SettingsLayout>
    );
};
