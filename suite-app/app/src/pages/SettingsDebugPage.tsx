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
    DebugAnalyticsLogging,
    DebugBackends,
    DebugCheckFirmwareAuthenticity,
    DebugClearDevicePersistentData,
    DebugCoinjoinApi,
    DebugConnectPopup,
    DebugDefinitionsEnvironmentSelect,
    DebugDeviceAuthenticity,
    DebugDevkit,
    DebugEarnStakingApi,
    DebugEarnYieldApi,
    DebugFirmwareUpdateEnvironmentSelect,
    DebugFlags,
    DebugForgetAllDevicesButton,
    DebugGithubIssue,
    DebugMetadata,
    DebugN4w1Backup,
    DebugOAuthApi,
    DebugPingDevice,
    DebugPlatformEncryption,
    DebugQuotaManagerSettings,
    DebugResetThpCredentials,
    DebugShowBluetoothDebugInfo,
    DebugThrowTestingError,
    DebugTor,
    DebugTradeApi,
    DebugTransport,
    DebugTransportBackends,
    DebugTrezorConnectLogs,
    DebugTriggerHighlight,
    DebugTriggerToast,
    DebugWebauthn,
    DebugWipeData,
    SettingsLayout,
    TriggerActivityNotification,
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
                <DebugGithubIssue />
                {isDesktop() && <DebugWipeData />}
                <DebugTriggerHighlight />
                <DebugTriggerToast />
                <TriggerActivityNotification />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Analytics">
                <DebugAnalyticsLogging />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Trade">
                <DebugTradeApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Apps embedding">
                <AppsEmbeddingSwitch />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Earn">
                <DebugEarnYieldApi />
                <DebugEarnStakingApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="OAuth">
                <DebugOAuthApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Coinjoin">
                <DebugCoinjoinApi />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Device">
                <DebugDeviceAuthenticity />
                <DebugDevkit />
                <DebugCheckFirmwareAuthenticity />
                <DebugClearDevicePersistentData />
                <DebugN4w1Backup />
                <DebugPingDevice />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Testing">
                <DebugThrowTestingError />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title="Transport backends"
                >
                    <DebugTransportBackends />
                </SettingsSection>
            )}
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Transport clients"
            >
                <DebugTransport />
            </SettingsSection>
            {isDesktop() && (
                <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Tor">
                    <DebugTor />
                </SettingsSection>
            )}
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Backends">
                <DebugBackends />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Flags">
                <DebugFlags />
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
                    <DebugShowBluetoothDebugInfo />
                    <DebugForgetAllDevicesButton />
                </SettingsSection>
            )}
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Trezor Host Protocol"
            >
                <DebugResetThpCredentials />
            </SettingsSection>
            <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="TrezorConnect">
                <DebugTrezorConnectLogs />
                <DebugDefinitionsEnvironmentSelect />
                {isDesktop() && <DebugConnectPopup />}
            </SettingsSection>
            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title="Firmware channel"
            >
                <DebugFirmwareUpdateEnvironmentSelect />
            </SettingsSection>
            <SuiteSyncSettings onError={handleWipeSuiteSyncLabelsError} />
            <DebugQuotaManagerSettings />
            <DebugPlatformEncryption />
            <DebugWebauthn />
        </SettingsLayout>
    );
};
