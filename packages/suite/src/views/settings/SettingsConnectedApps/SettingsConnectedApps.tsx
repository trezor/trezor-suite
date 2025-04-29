import { useState } from 'react';

import { selectDevices } from '@suite-common/wallet-core';
import { selectSessions } from '@suite-common/walletconnect';
import { Column, Icon, Row, SubTabs } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const hasSupportedDevice =
        useSelector(selectDevices).find(device => !hasBitcoinOnlyFirmware(device)) !== undefined;
    const hasExistingWalletConnectSessions = useSelector(selectSessions).length > 0;
    const wcEnabled = hasSupportedDevice || hasExistingWalletConnectSessions;

    const tabs = [
        {
            id: 'trezor-connect',
            icon: 'trezorLogo' as const,
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
            isEnabled: true,
        },
        {
            id: 'walletconnect',
            icon: 'walletConnect' as const,
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
            isEnabled: wcEnabled,
        },
    ].filter(tab => tab.isEnabled);
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
                {wcEnabled && (
                    <WalletConnectButton handleOpened={() => setActiveItemId('walletconnect')} />
                )}
            </Row>
            {tabs.find(tab => tab.id === activeItemdId)?.component}
        </Column>
    );
};
