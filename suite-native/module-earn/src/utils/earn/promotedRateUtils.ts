import { isApyAvailable } from '@suite-common/wallet-utils';

export const EARN_PROMO_SYMBOLS = ['eth', 'sol'] as const;
export type EarnPromoSymbol = (typeof EARN_PROMO_SYMBOLS)[number];

export const isEarnPromoSymbol = (symbol?: string | null): symbol is EarnPromoSymbol =>
    symbol != null && EARN_PROMO_SYMBOLS.some(earnPromoSymbol => earnPromoSymbol === symbol);

type GetBestPromotedRateParams = {
    vaultApy: number | null;
    stakingRate: number | null;
};

type BestPromotedRate = {
    apy: number;
    /** Which rate won — the vault's label and link only apply to a vault rate. */
    isVaultRate: boolean;
};

/**
 * The best rate a native coin can earn by any means: its wrapped-native vault, staking, or
 * whichever of the two is higher when both are on offer. `null` when neither is available.
 */
export const getBestPromotedRate = ({
    vaultApy,
    stakingRate,
}: GetBestPromotedRateParams): BestPromotedRate | null => {
    const promotableVaultApy = isApyAvailable(vaultApy) ? vaultApy : null;
    const promotableStakingRate =
        stakingRate !== null && isApyAvailable(stakingRate) ? stakingRate : null;

    if (promotableVaultApy !== null && promotableStakingRate !== null) {
        return promotableVaultApy >= promotableStakingRate
            ? { apy: promotableVaultApy, isVaultRate: true }
            : { apy: promotableStakingRate, isVaultRate: false };
    }

    if (promotableVaultApy !== null) {
        return { apy: promotableVaultApy, isVaultRate: true };
    }

    if (promotableStakingRate !== null) {
        return { apy: promotableStakingRate, isVaultRate: false };
    }

    return null;
};
