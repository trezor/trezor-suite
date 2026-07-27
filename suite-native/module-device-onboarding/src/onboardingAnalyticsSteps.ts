import { type DeviceOnboardingStepName } from '@suite-common/analytics';
import { DeviceOnboardingStackRoutes } from '@suite-native/navigation';

// Screens that are not main flow steps map to `null`.
export const screenToAnalyticsStepMap: Record<
    DeviceOnboardingStackRoutes,
    DeviceOnboardingStepName | null
> = {
    [DeviceOnboardingStackRoutes.DeviceDisconnected]: null,
    [DeviceOnboardingStackRoutes.UninitializedDeviceLanding]: 'security-check',
    [DeviceOnboardingStackRoutes.SuspiciousDevice]: null,
    [DeviceOnboardingStackRoutes.SecurityCheck]: 'security-check',
    [DeviceOnboardingStackRoutes.FirmwareInfo]: 'firmware',
    [DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate]: 'firmware',
    [DeviceOnboardingStackRoutes.FirmwareInstallation]: 'firmware',
    [DeviceOnboardingStackRoutes.ThpPairingInfo]: 'thp-pairing',
    [DeviceOnboardingStackRoutes.ThpConfirmation]: 'thp-pairing',
    [DeviceOnboardingStackRoutes.ThpCodeEntry]: 'thp-pairing',
    [DeviceOnboardingStackRoutes.ThpPairingSuccess]: null,
    [DeviceOnboardingStackRoutes.DeviceAuthenticity]: 'authenticate-device',
    [DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess]: null,
    [DeviceOnboardingStackRoutes.DeviceTutorial]: 'tutorial',
    [DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads]: 'create-or-recover',
    [DeviceOnboardingStackRoutes.CreateWalletLoading]: null,
    [DeviceOnboardingStackRoutes.WalletBackupTutorial]: 'backup-type',
    [DeviceOnboardingStackRoutes.WalletCreation]: 'security',
    [DeviceOnboardingStackRoutes.WalletCreatedSuccess]: null,
    [DeviceOnboardingStackRoutes.WalletBackupRecap]: 'security',
    [DeviceOnboardingStackRoutes.RecoveryInstructions]: 'recovery',
    [DeviceOnboardingStackRoutes.WalletRecovery]: 'recovery',
    [DeviceOnboardingStackRoutes.WalletRecoveryRecap]: 'recovery',
    [DeviceOnboardingStackRoutes.CreatePin]: 'set-pin',
    [DeviceOnboardingStackRoutes.Congratulations]: 'final',
};

// Mobile happy-path order for the 1-based step index. Per-platform on purpose: it
// must not depend on desktop ordering — funnels are joined on `stepName`.
const deviceOnboardingAnalyticsStepOrder = [
    'security-check',
    'firmware',
    'thp-pairing',
    'authenticate-device',
    'tutorial',
    'create-or-recover',
    'backup-type',
    'recovery',
    'security',
    'set-pin',
    'final',
] as const satisfies readonly DeviceOnboardingStepName[];

export const getDeviceOnboardingAnalyticsStepIndex = (stepName: DeviceOnboardingStepName): number =>
    deviceOnboardingAnalyticsStepOrder.indexOf(stepName) + 1;
