import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Column, Icon, Row, SubTabs } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { useDispatch } from 'src/hooks/suite';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const dispatch = useDispatch();

    const tabs = [
        {
            id: 'walletconnect',
            icon: 'walletConnect' as const,
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
            isEnabled: true,
        },
        {
            id: 'trezor-connect',
            icon: 'trezorLogo' as const,
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
            isEnabled: isDesktop(),
        },
    ].filter(tab => tab.isEnabled);
    const [activeItemdId, setActiveItemId] = useState(tabs[0]?.id ?? 0);

    useEffect(() => {
        if (tabs.length === 0) {
            dispatch(goto({ routeName: 'settings-index' }));
        }
    }, [tabs.length, dispatch]);

    return (
        <SettingsLayout>
            <Column gap={spacings.md} flex="1">
                <Row justifyContent="space-between" flexWrap="wrap" gap={spacings.sm}>
                    <SubTabs size="large" activeItemId={activeItemdId}>
                        {tabs.map(tab => (
                            <SubTabs.Item
                                key={tab.id}
                                id={tab.id}
                                data-testid={`@settings/connect-apps/tabs/${tab.id}`}
                                onClick={() => setActiveItemId(tab.id)}
                            >
                                <Row alignItems="center" gap={spacings.xs}>
                                    <Icon name={tab.icon} />
                                    {tab.title}
                                </Row>
                            </SubTabs.Item>
                        ))}
                    </SubTabs>
                    <WalletConnectButton handleOpened={() => setActiveItemId('walletconnect')} />
                </Row>
                {tabs.find(tab => tab.id === activeItemdId)?.component}
            </Column>
        </SettingsLayout>
    );
};
