import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Grid, Text, Tooltip } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';

import { type TokenRewards } from './hooks/useYieldClaimRewardsData';

interface EarnYieldClaimRewardsBannerTokensTooltipProps {
    rewards: TokenRewards;
    currency: BaseCurrencyCode;
}

export const EarnYieldClaimRewardsBannerTokensTooltip = ({
    rewards,
    currency,
}: EarnYieldClaimRewardsBannerTokensTooltipProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (rewards.length === 0) return null;

    return (
        <Tooltip
            width="auto"
            content={
                <Grid columns="auto auto" rowGap={4} columnGap={24}>
                    {rewards.map(({ symbol, crypto, fiat }) => (
                        <>
                            <Text>
                                <FormattedCryptoAmount value={crypto.toString()} symbol={symbol} />
                            </Text>

                            <Text align="end">
                                <BaseCurrencyAmountFormatter
                                    value={asBaseCurrencyAmount(fiat)}
                                    currency={currency}
                                />
                            </Text>
                        </>
                    ))}
                </Grid>
            }
        >
            <Text cursor="default">
                {rewards.length === 1 ? (
                    <Translation
                        id="TR_EARN_CLAIM_REWARDS_TOKEN_LABEL"
                        values={{ symbol: rewards[0]!.symbol }}
                    />
                ) : (
                    <Translation
                        id="TR_EARN_CLAIM_REWARDS_TOKENS_LABEL"
                        values={{ tokens: rewards.length }}
                    />
                )}
            </Text>
        </Tooltip>
    );
};
