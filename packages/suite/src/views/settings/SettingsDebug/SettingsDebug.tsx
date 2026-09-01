import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    ContextMessage,
    MessageSystemConfigSourceSelect,
    MessageSystemDebug,
} from '@suite/message-system';
import { SuiteSyncSettings, suiteSyncErrorHandler } from '@suite/suite-sync';
import { Context } from '@suite-common/message-system';
import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { SettingsSection } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { TriggerActivityNotification } from 'src/components/suite/notifications/TriggerActivityNotification/TriggerActivityNotification';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AnalyticsLogging } from './AnalyticsLogging';
import { Backends } from './Backends';
import { CheckFirmwareAuthenticity } from './CheckFirmwareAuthenticity';
import { ClearDevicePersistentData } from './ClearDevicePersistentData';
import { CoinjoinApi } from './CoinjoinApi';
import { ConnectPopup } from './ConnectPopup';
import { DefinitionsEnvironmentSelect } from './DefinitionsEnvironmentSelect';
import { DeviceAuthenticity } from './DeviceAuthenticity';
import { Devkit } from './Devkit';
import { EarnApi } from './EarnApi';
import { FirmwareUpdateEnvironmentSelect } from './FirmwareUpdateEnvironmentSelect';
import { Flags } from './Flags';
import { ForgetAllDevicesButton } from './ForgetBluetoothDevices';
import { GithubIssue } from './GithubIssue';
import { Metadata } from './Metadata';
import { N4w1Backup } from './N4w1Backup';
import { OAuthApi } from './OAuthApi';
import { PingDevice } from './PingDevice';
import { PlatformEncryption } from './PlatformEncryption';
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
    const dispatch = useDispatch();
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.laptop);

    const handleWipeSuiteSyncLabelsError = ({
        error,
        deviceStaticSessionId,
    }: {
        error: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;
        deviceStaticSessionId: StaticSessionId;
    }) => {
        suiteSyncErrorHandler({
            error,
            dispatch,
            deviceStaticSessionId,
        });
    };

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('debug')} />

            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Debug">
                <GithubIssue />
                {isDesktop() && <WipeData />}
                <TriggerHighlight />
                <TriggerToast />
                <TriggerActivityNotification />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Analytics">
                <AnalyticsLogging />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Trade">
                <TradeApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Earn">
                <EarnApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="OAuth">
                <OAuthApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Coinjoin">
                <CoinjoinApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Device">
                <DeviceAuthenticity />
                <Devkit />
                <CheckFirmwareAuthenticity />
                <ClearDevicePersistentData />
                <N4w1Backup />
                <PingDevice />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Testing">
                <ThrowTestingError />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title="Transport backends"
                >
                    <TransportBackends />
                </SettingsSection>
            )}
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Transport clients"
            >
                <Transport />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Tor">
                    <Tor />
                </SettingsSection>
            )}
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Backends">
                <Backends />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Flags">
                <Flags />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Metadata">
                <Metadata />
            </SettingsSection>
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Message system info"
            >
                <MessageSystemConfigSourceSelect />
                <MessageSystemDebug />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_BLUETOOTH" />}
                >
                    <ShowBluetoothDebugInfo />
                    <ForgetAllDevicesButton />
                </SettingsSection>
            )}
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Trezor Host Protocol"
            >
                <ResetThpCredentials />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="TrezorConnect">
                <TrezorConnectLogs />
                <DefinitionsEnvironmentSelect />
                {isDesktop() && <ConnectPopup />}
            </SettingsSection>
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Firmware channel"
            >
                <FirmwareUpdateEnvironmentSelect />
            </SettingsSection>
            <SuiteSyncSettings onError={handleWipeSuiteSyncLabelsError} />
            <QuotaManagerSettings />
            <PlatformEncryption />
        </SettingsLayout>
    );
};
