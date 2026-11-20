import { type TxKeyPath } from '@suite-native/intl';

export const earnBalanceColors = {
    available: 'elementFillAccentVioletBold',
    unstaked: 'elementFillNeutralSoft',
    staked: 'elementFillBrandBold',
} as const;

export type EarnBalanceType = keyof typeof earnBalanceColors;

export type UnstakedEarnBalanceType = Exclude<EarnBalanceType, 'staked'>;

export const earnBalanceLabelTranslationKeys = {
    available: 'moduleAssets.assetDetailScreen.earnSection.available',
    unstaked: 'moduleAssets.assetDetailScreen.earnSection.unstaked',
    staked: 'moduleAssets.assetDetailScreen.earnSection.staked',
} as const satisfies Record<EarnBalanceType, TxKeyPath>;
