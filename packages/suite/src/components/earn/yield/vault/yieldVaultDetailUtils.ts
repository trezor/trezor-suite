import { type RewardDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';

type RewardToken = RewardDtoV2['token'];

export type YieldVaultBonusRewardRate = {
    token: RewardToken;
    rate: number;
};

const getRewardTokenKey = (token: RewardToken) =>
    token.address ? token.address.toLowerCase() : `${token.network}:${token.symbol}`;

const isSameRewardToken = (a: RewardToken, b: RewardToken) => {
    if (a.address && b.address) {
        return a.address.toLowerCase() === b.address.toLowerCase();
    }

    if (!a.address && !b.address) {
        return a.network === b.network && a.symbol === b.symbol;
    }

    return false;
};

// Rewards paid out in a token other than the vault's underlying asset, one entry per payout token.
export const getBonusRewards = (
    vault: Pick<YieldDtoV2, 'token' | 'rewardRate'>,
): YieldVaultBonusRewardRate[] => {
    const bonusRewardsByToken = new Map<string, YieldVaultBonusRewardRate>();

    vault.rewardRate.components.forEach(reward => {
        if (reward.rate <= 0 || isSameRewardToken(reward.token, vault.token)) {
            return;
        }

        const key = getRewardTokenKey(reward.token);
        const bonusReward = bonusRewardsByToken.get(key);

        bonusRewardsByToken.set(key, {
            token: bonusReward?.token ?? reward.token,
            rate: (bonusReward?.rate ?? 0) + reward.rate,
        });
    });

    return [...bonusRewardsByToken.values()];
};

type GetRewardsFiatAmountParams = {
    depositFiatAmount: BaseCurrencyAmount | null;
    underlyingRate: number;
    bonusRate: number | null;
};

export const getRewardsFiatAmount = ({
    depositFiatAmount,
    underlyingRate,
    bonusRate,
}: GetRewardsFiatAmountParams) =>
    depositFiatAmount
        ? asBaseCurrencyAmount(
              depositFiatAmount.times(underlyingRate).plus(depositFiatAmount.times(bonusRate ?? 0)),
          )
        : null;

type GetBonusRewardAmountParams = {
    depositFiatAmount: BaseCurrencyAmount | null;
    bonusRate: number | null;
    bonusTokenRate: number | undefined;
};

export const getBonusRewardAmount = ({
    depositFiatAmount,
    bonusRate,
    bonusTokenRate,
}: GetBonusRewardAmountParams) =>
    depositFiatAmount && bonusRate !== null && bonusTokenRate
        ? depositFiatAmount.times(bonusRate).div(bonusTokenRate).toString()
        : null;
