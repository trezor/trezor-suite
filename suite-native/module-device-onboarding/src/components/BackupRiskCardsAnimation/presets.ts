import { type IconName } from '@suite-native/icons';
import { type TxKeyPath } from '@suite-native/intl';
import { type Color } from '@trezor/theme';

export type TileVariant = 'lost' | 'damaged' | 'stolen';

export type TileStyles = {
    backgroundColor: Color;
    borderColor: Color;
    text: Color;
};

export const variantToColorMap = {
    damaged: {
        backgroundColor: 'baseFillElementWarningSofter',
        borderColor: 'baseBorderElementWarningSofter',
        text: 'baseContentWarning',
    },
    lost: {
        backgroundColor: 'baseFillElementInfoSofter',
        borderColor: 'baseBorderElementInfoSofter',
        text: 'baseContentInfo',
    },
    stolen: {
        backgroundColor: 'baseFillElementNegativeSofter',
        borderColor: 'baseBorderElementNegativeSofter',
        text: 'baseContentNegative',
    },
} as const satisfies Record<TileVariant, TileStyles>;

export const variantToIconName = {
    stolen: 'detective',
    lost: 'questionSimple',
    damaged: 'surfaceProtection',
} as const satisfies Record<TileVariant, IconName>;

export const variantToLabel = {
    stolen: 'moduleDeviceOnboarding.walletBackupTutorialScreen.step2.risks.stolen',
    lost: 'moduleDeviceOnboarding.walletBackupTutorialScreen.step2.risks.lost',
    damaged: 'moduleDeviceOnboarding.walletBackupTutorialScreen.step2.risks.damaged',
} as const satisfies Record<TileVariant, TxKeyPath>;
