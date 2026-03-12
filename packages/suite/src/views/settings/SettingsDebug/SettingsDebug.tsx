import { selectFlags } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { SuiteSyncSettings } from '@suite/suite-sync';
import { Context } from '@suite-common/message-system';
import { isDesktop } from '@trezor/env-utils';
import { SettingsSection } from '@trezor/product-components';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { AnalyticsLogging } from './AnalyticsLogging';
import { Backends } from './Backends';
import { CheckFirmwareAuthenticity } from './CheckFirmwareAuthenticity';
import { ClearDevicePersistentData } from './ClearDevicePersistentData';
import { CoinjoinApi } from './CoinjoinApi';
import { ConnectPopup } from './ConnectPopup';
import { DeviceAuthenticity } from './DeviceAuthenticity';
import { Devkit } from './Devkit';
import { FirmwareUpdateEnvironmentSelect } from './FirmwareUpdateEnvironmentSelect';
import { ForgetAllDevicesButton } from './ForgetBluetoothDevices';
import { GithubIssue } from './GithubIssue';
import { McpServer } from './McpServer';
import { MessageSystemConfigSourceSelect } from './MessageSystem/MessageSystemConfigSourceSelect';
import { MessageSystemDebug } from './MessageSystem/MessageSystemDebug';
import { Metadata } from './Metadata';
import { N4w1Backup } from './N4w1Backup';
import { OAuthApi } from './OAuthApi';
import { PlatformEncrypton } from './PlatformEncrypton';
import { PreField } from './PreField';
import { QuotaManagerSettings } from './QuotaManagerSettings';
import { ResetThpCredentials } from './ResetThpCredentials';
import { ShowBluetoothDebugInfo } from './ShowBluetoothDebugInfo';
import { ThrowTestingError } from './ThrowTestingError';
import { Tor } from './Tor';
import { TradeApi } from './TradeApi';
import { Transport } from './Transport';
import { TransportBackends } from './TransportBackends';
import { TrezorConnectLogs } from './TrezorConnectLogs';
import { TriggerHighlight } from './TriggerHighlight';
import { TriggerToast } from './TriggerToast';
import { WipeData } from './WipeData';

export const SettingsDebug = () => {
    const { isBelowLaptop } = useLayoutSize();
    const flags = useSelector(selectFlags);
    const isSuiteSyncFeatureEnabled = useSelector(selectHasExperimentalFeature('suite-sync'));
    const { suiteSync } = useSuiteServices();

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('debug')} />

            <SettingsSection isBelowLaptop={isBelowLaptop} title="Debug">
                <GithubIssue />
                {isDesktop() && <WipeData />}
                <TriggerHighlight />
                <TriggerToast />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Analytics">
                <AnalyticsLogging />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Trade">
                <TradeApi />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="OAuth">
                <OAuthApi />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Coinjoin">
                <CoinjoinApi />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Device">
                <DeviceAuthenticity />
                <Devkit />
                <CheckFirmwareAuthenticity />
                <ClearDevicePersistentData />
                <N4w1Backup />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Testing">
                <ThrowTestingError />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection isBelowLaptop={isBelowLaptop} title="Transport backends">
                    <TransportBackends />
                </SettingsSection>
            )}
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Transport clients">
                <Transport />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection isBelowLaptop={isBelowLaptop} title="Tor">
                    <Tor />
                </SettingsSection>
            )}
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Backends">
                <Backends />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Flags JSON">
                <PreField>{JSON.stringify(flags)}</PreField>
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Metadata">
                <Metadata />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Message system info">
                <MessageSystemConfigSourceSelect />
                <MessageSystemDebug />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_BLUETOOTH" />}
                >
                    <ShowBluetoothDebugInfo />
                    <ForgetAllDevicesButton />
                </SettingsSection>
            )}
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Trezor Host Protocol">
                <ResetThpCredentials />
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="TrezorConnect">
                <TrezorConnectLogs />
                {isDesktop() && <ConnectPopup />}
                {isDesktop() && <McpServer />}
            </SettingsSection>
            <SettingsSection isBelowLaptop={isBelowLaptop} title="Firmware channel">
                <FirmwareUpdateEnvironmentSelect />
            </SettingsSection>
            <SuiteSyncSettings
                isSuiteSyncFeatureEnabled={isSuiteSyncFeatureEnabled}
                suiteSync={suiteSync}
            />
            <QuotaManagerSettings />
            <PlatformEncrypton />
        </SettingsLayout>
    );
};
