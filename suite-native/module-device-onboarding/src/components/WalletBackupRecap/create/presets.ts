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
        iconBackgroundColor: 'elementFillNeutralSofter',
    },
    warning: {
        iconColor: 'contentWarning',
        iconBorderColor: 'elementBorderWarningSofter',
        iconBackgroundColor: 'elementFillWarningSofter',
    },
    primary: {
        iconColor: 'contentButtonBrandPrimary',
        iconBorderColor: 'elementFillBrandBold',
        iconBackgroundColor: 'elementFillBrandBold',
    },
} as const satisfies Record<ColorVariant, IconColors>;

export const connectorColorsMap = {
    default: ['elementFillNeutralSofter', 'elementFillNeutralSofter'],
    warning: ['elementFillWarningSofter', 'elementFillNeutralSofter'],
    primary: ['elementFillNeutralSofter', 'elementFillBrandBold'],
} as const satisfies Record<ColorVariant, [Color, Color]>;
