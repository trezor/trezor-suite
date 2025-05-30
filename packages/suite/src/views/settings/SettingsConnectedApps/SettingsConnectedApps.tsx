import { useEffect, useState } from 'react';

import { selectDevices } from '@suite-common/wallet-core';
import { selectSessions } from '@suite-common/walletconnect';
import { Column, Icon, Row, SubTabs } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasExperimentalFeature } from 'src/reducers/suite/suiteReducer';

import { ConnectPermissions } from './ConnectPermissions';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletConnectList } from './WalletConnectList';

export const SettingsConnectedApps = () => {
    const dispatch = useDispatch();
    const hasSupportedDevice =
        useSelector(selectDevices).find(device => !hasBitcoinOnlyFirmware(device)) !== undefined;
    const hasExistingWalletConnectSessions = useSelector(selectSessions).length > 0;
    const wcFeatureFlag = useSelector(selectHasExperimentalFeature('walletconnect'));
    const connectFeatureFlag = useSelector(selectHasExperimentalFeature('trezor-connect-ws'));
    const wcEnabled = wcFeatureFlag && (hasSupportedDevice || hasExistingWalletConnectSessions);

    const tabs = [
        {
            id: 'trezor-connect',
            icon: 'trezorLogo' as const,
            title: <Translation id="TR_TREZOR_CONNECT" />,
            component: <ConnectPermissions />,
            isEnabled: connectFeatureFlag,
        },
        {
            id: 'walletconnect',
            icon: 'walletConnect' as const,
            title: <Translation id="TR_WALLETCONNECT" />,
            component: <WalletConnectList />,
            isEnabled: wcEnabled,
        },
    ].filter(tab => tab.isEnabled);
    const [activeItemdId, setActiveItemId] = useState(tabs[0]?.id ?? 0);

    useEffect(() => {
        if (tabs.length === 0) {
            dispatch(goto('settings-index'));
        }
    }, [tabs.length, dispatch]);

    return (
        <Column gap={spacings.md} margin={{ top: spacings.md }} flex="1">
            <Row justifyContent="space-between" flexWrap="wrap" gap={spacings.sm}>
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
