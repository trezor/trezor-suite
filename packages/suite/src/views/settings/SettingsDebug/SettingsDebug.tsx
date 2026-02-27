import { Translation } from '@suite/intl';
import { Context } from '@suite-common/message-system';
import { isDesktop } from '@trezor/env-utils';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

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
import { MessageSystemConfigSourceSelect } from './MessageSystem/MessageSystemConfigSourceSelect';
import { MessageSystemDebug } from './MessageSystem/MessageSystemDebug';
import { Metadata } from './Metadata';
import { OAuthApi } from './OAuthApi';
import { PlatformEncrypton } from './PlatformEncrypton';
import { PreField } from './PreField';
import { QuotaManagerSettings } from './QuotaManagerSettings';
import { ResetThpCredentials } from './ResetThpCredentials';
import { ShowBluetoothDebugInfo } from './ShowBluetoothDebugInfo';
import { SuiteSyncSettings } from './SuiteSyncSettings';
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
    const flags = useSelector(selectSuiteFlags);

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('debug')} />

            <SettingsSection title="Debug">
                <GithubIssue />
                {isDesktop() && <WipeData />}
                <TriggerHighlight />
                <TriggerToast />
            </SettingsSection>
            <SettingsSection title="Analytics">
                <AnalyticsLogging />
            </SettingsSection>
            <SettingsSection title="Trade">
                <TradeApi />
            </SettingsSection>
            <SettingsSection title="OAuth">
                <OAuthApi />
            </SettingsSection>
            <SettingsSection title="Coinjoin">
                <CoinjoinApi />
            </SettingsSection>
            <SettingsSection title="Device">
                <DeviceAuthenticity />
                <Devkit />
                <CheckFirmwareAuthenticity />
                <ClearDevicePersistentData />
            </SettingsSection>
            <SettingsSection title="Testing">
                <ThrowTestingError />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection title="Transport backends">
                    <TransportBackends />
                </SettingsSection>
            )}
            <SettingsSection title="Transport clients">
                <Transport />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection title="Tor">
                    <Tor />
                </SettingsSection>
            )}
            <SettingsSection title="Backends">
                <Backends />
            </SettingsSection>
            <SettingsSection title="Flags JSON">
                <PreField>{JSON.stringify(flags)}</PreField>
            </SettingsSection>
            <SettingsSection title="Metadata">
                <Metadata />
            </SettingsSection>
            <SettingsSection title="Message system info">
                <MessageSystemConfigSourceSelect />
                <MessageSystemDebug />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection title={<Translation id="TR_BLUETOOTH" />}>
                    <ShowBluetoothDebugInfo />
                    <ForgetAllDevicesButton />
                </SettingsSection>
            )}
            <SettingsSection title="Trezor Host Protocol">
                <ResetThpCredentials />
            </SettingsSection>
            <SettingsSection title="TrezorConnect">
                <TrezorConnectLogs />
                {isDesktop() && <ConnectPopup />}
            </SettingsSection>
            <SettingsSection title="Firmware channel">
                <FirmwareUpdateEnvironmentSelect />
            </SettingsSection>
            <SuiteSyncSettings />
            <QuotaManagerSettings />
            <PlatformEncrypton />
        </SettingsLayout>
    );
};
