import { type IconName } from '@suite-native/icons';
import { type TxKeyPath } from '@suite-native/intl';
import { type Color } from '@trezor/theme';

export const WALLET_BACKUP_RECAP_STEPS = 4;

export type ItemIntent = 'neutral' | 'warning' | 'brand';

export const walletBackupSecuritySteps = [
    {
        iconName: 'warning',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step1',
        iconIntent: 'warning',
        connectorIntent: 'warning',
    },
    {
        iconName: 'trezorSafe5',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step2',
        iconIntent: 'neutral',
        connectorIntent: 'neutral',
    },
    {
        iconName: 'textAa',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step3',
        iconIntent: 'neutral',
        connectorIntent: 'brand',
    },
    {
        iconName: 'check',
        labelId: 'moduleDeviceOnboarding.walletBackupRecapScreen.step1.step4',
        iconIntent: 'brand',
        connectorIntent: 'brand',
    },
] as const satisfies {
    iconName: IconName;
    labelId: TxKeyPath;
    iconIntent: ItemIntent;
    connectorIntent: ItemIntent;
}[];

export const connectorColorsMap = {
    neutral: ['elementFillNeutralSofter', 'elementFillNeutralSofter'],
    warning: ['elementFillWarningSofter', 'elementFillNeutralSofter'],
    brand: ['elementFillNeutralSofter', 'elementFillBrandSoft'],
} as const satisfies Record<ItemIntent, [Color, Color]>;
