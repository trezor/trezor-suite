import { AppsEmbeddingSwitch } from '@suite/apps-embedding-demo';
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
import { useServices } from '@trezor/dependency-injection';
import { isDesktop } from '@trezor/env-utils';
import { SettingsSection } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';
import {
    AnalyticsLogging,
    Backends,
    CheckFirmwareAuthenticity,
    ClearDevicePersistentData,
    CoinjoinApi,
    ConnectPopup,
    DebugMetadata,
    DefinitionsEnvironmentSelect,
    DeviceAuthenticity,
    Devkit,
    EarnStakingApi,
    EarnYieldApi,
    FirmwareUpdateEnvironmentSelect,
    Flags,
    ForgetAllDevicesButton,
    GithubIssue,
    N4w1Backup,
    OAuthApi,
    PingDevice,
    PlatformEncryption,
    QuotaManagerSettings,
    ResetThpCredentials,
    SettingsLayout,
    ShowBluetoothDebugInfo,
    ThrowTestingError,
    Tor,
    TradeApi,
    Transport,
    TransportBackends,
    TrezorConnectLogs,
    TriggerActivityNotification,
    TriggerHighlight,
    TriggerToast,
    WipeData,
    useIsContentBelowBreakpoint,
} from '@trezor/suite';
import { breakpoints } from '@trezor/theme';

export const SettingsDebugPage = () => {
    const { dispatch } = useServices(injectDispatch);
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.laptop);

    type HandleWipeSuiteSyncLabelsErrorParams = {
        error: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;
        deviceStaticSessionId: StaticSessionId;
    };

    const handleWipeSuiteSyncLabelsError = ({
        error,
        deviceStaticSessionId,
    }: HandleWipeSuiteSyncLabelsErrorParams) => {
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
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Apps embedding">
                <AppsEmbeddingSwitch />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Earn">
                <EarnYieldApi />
                <EarnStakingApi />
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
                <DebugMetadata />
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
