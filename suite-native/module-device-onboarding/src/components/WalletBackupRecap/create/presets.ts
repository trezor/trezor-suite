import { type IconName } from '@suite-native/icons';
import { type TxKeyPath } from '@suite-native/intl';
import { type Color } from '@trezor/theme';

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
        iconColor: 'contentPrimary',
        iconBorderColor: 'borderNeutral',
        iconBackgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
    },
    warning: {
        iconColor: 'contentWarning',
        iconBorderColor: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
    },
    primary: {
        iconColor: 'contentPrimaryInverse',
        iconBorderColor: 'legacyBackgroundPrimaryDefault',
        iconBackgroundColor: 'legacyBackgroundPrimaryDefault',
    },
} as const satisfies Record<ColorVariant, IconColors>;

export const connectorColorsMap = {
    default: [
        'legacyBackgroundTertiaryDefaultOnElevation0',
        'legacyBackgroundTertiaryDefaultOnElevation0',
    ],
    warning: [
        'legacyBackgroundAlertYellowSubtleOnElevation1',
        'legacyBackgroundTertiaryDefaultOnElevation0',
    ],
    primary: ['legacyBackgroundTertiaryDefaultOnElevation0', 'legacyBackgroundPrimaryDefault'],
} as const satisfies Record<ColorVariant, [Color, Color]>;
