import { useState } from 'react';

import { Column, Icon, Row, SubTabs } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const tabs = [
        {
            id: 'trezor-connect',
            icon: 'trezorLogo' as const,
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
        },
        {
            id: 'walletconnect',
            icon: 'walletConnect' as const,
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
        },
    ];
    const [activeItemdId, setActiveItemId] = useState(tabs[0].id);

    return (
        <Column gap={spacings.md} margin={{ top: spacings.md }} flex="1">
            <Row justifyContent="space-between">
                <SubTabs size="large" activeItemId={activeItemdId}>
                    {tabs.map(tab => (
                        <SubTabs.Item
                            key={tab.id}
                            id={tab.id}
                            onClick={() => setActiveItemId(tab.id)}
                        >
                            <Row alignItems="center" gap={spacings.xs}>
                                <Icon name={tab.icon} />
                                {tab.title}
                            </Row>
                        </SubTabs.Item>
                    ))}
                </SubTabs>
                <WalletConnectButton />
            </Row>
            {tabs.find(tab => tab.id === activeItemdId)?.component}
        </Column>
    );
};
