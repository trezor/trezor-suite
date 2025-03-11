import { useState } from 'react';

import { Card, Column, H3, Row, Tabs } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsLayout } from 'src/components/settings';
import { Translation } from 'src/components/suite';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const tabs = [
        {
            id: 'trezor-connect',
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
        },
        {
            id: 'walletconnect',
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
        },
    ];
    const [activeItemdId, setActiveItemId] = useState(tabs[0].id);

    return (
        <SettingsLayout>
            <Column gap={spacings.md}>
                <Row justifyContent="space-between">
                    <H3>
                        <Translation id="TR_CONNECTED_APPS" />
                    </H3>
                    <WalletConnectButton />
                </Row>
                <Card paddingType="none">
                    <Column hasDivider>
                        <Column padding={{ top: spacings.sm, left: spacings.lg }}>
                            <Tabs size="large" activeItemId={activeItemdId} hasBorder={false}>
                                {tabs.map(tab => (
                                    <Tabs.Item
                                        key={tab.id}
                                        id={tab.id}
                                        onClick={() => setActiveItemId(tab.id)}
                                    >
                                        {tab.title}
                                    </Tabs.Item>
                                ))}
                            </Tabs>
                        </Column>
                        {tabs.find(tab => tab.id === activeItemdId)?.component}
                    </Column>
                </Card>
            </Column>
        </SettingsLayout>
    );
};
