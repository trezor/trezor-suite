import { IconName } from '@suite-native/icons';
import { TxKeyPath } from '@suite-native/intl';
import { Color } from '@trezor/theme';

export const WALLET_BACKUP_RECAP_STEPS = 4;

export type ColorVariant = 'default' | 'warning' | 'primary';

type IconColors = {
    iconColor: Color;
    iconBorderColor: Color;
    iconBackgroundColor: Color;
};

export const walletBackupSecuritySteps = [
    {
        iconName: 'warning',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step1',
        iconVariant: 'warning',
        connectorVariant: 'warning',
    },
    {
        iconName: 'trezorSafe5',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step2',
    },
    {
        iconName: 'textAa',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step3',
        connectorVariant: 'primary',
    },
    {
        iconName: 'check',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step4',
        iconVariant: 'primary',
    },
] as const satisfies {
    iconName: IconName;
    labelId: TxKeyPath;
    iconVariant?: ColorVariant;
    connectorVariant?: ColorVariant;
}[];

export const iconColorsMap = {
    default: {
        iconColor: 'iconDefault',
        iconBorderColor: 'borderElevation0',
        iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
    },
    warning: {
        iconColor: 'iconAlertYellow',
        iconBorderColor: 'backgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
    },
    primary: {
        iconColor: 'iconDefaultInverted',
        iconBorderColor: 'backgroundPrimaryDefault',
        iconBackgroundColor: 'backgroundPrimaryDefault',
    },
} as const satisfies Record<ColorVariant, IconColors>;

export const connectorColorsMap = {
    default: ['backgroundTertiaryDefaultOnElevation0', 'backgroundTertiaryDefaultOnElevation0'],
    warning: ['backgroundAlertYellowSubtleOnElevation1', 'backgroundTertiaryDefaultOnElevation0'],
    primary: ['backgroundTertiaryDefaultOnElevation0', 'backgroundPrimaryDefault'],
} as const satisfies Record<ColorVariant, [Color, Color]>;
