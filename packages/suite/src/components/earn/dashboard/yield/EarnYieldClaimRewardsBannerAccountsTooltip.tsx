import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Grid, Text, Tooltip } from '@trezor/components';

import { type AccountRewards } from './hooks/useYieldClaimRewardsData';

interface EarnYieldClaimRewardsBannerAccountsTooltipProps {
    rewards: AccountRewards;
    currency: BaseCurrencyCode;
}

export const EarnYieldClaimRewardsBannerAccountsTooltip = ({
    rewards,
    currency,
}: EarnYieldClaimRewardsBannerAccountsTooltipProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (rewards.length < 2) return null;

    return (
        <Tooltip
            width="auto"
            content={
                <Grid columns="auto auto" rowGap={4} columnGap={24}>
                    {rewards.map(({ account, fiat }) => (
                        <>
                            <Text>
                                <AccountLabel account={account} showAccountTypeBadge />
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
                <Translation
                    id="TR_EARN_CLAIM_REWARDS_ACCOUNTS_LABEL"
                    values={{
                        accounts: rewards.length,
                    }}
                />
            </Text>
        </Tooltip>
    );
};
