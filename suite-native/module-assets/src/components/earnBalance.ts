import { type TxKeyPath } from '@suite-native/intl';

export const earnBalanceColors = {
    available: 'elementFillAccentVioletBold',
    staking: 'elementFillBrandBold',
} as const;

export type EarnBalanceType = keyof typeof earnBalanceColors;

export const earnBalanceLabels = {
    available: 'moduleAssets.assetDetailScreen.earnSection.available',
    staking: 'moduleAssets.assetDetailScreen.earnSection.staking',
} as const satisfies Record<EarnBalanceType, TxKeyPath>;
