import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Banner, Row, Skeleton, Text, Tooltip } from '@trezor/components';
import { HandCoinsIcon, InfoIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { EarnYieldClaimRewardsBannerAccountsTooltip } from './EarnYieldClaimRewardsBannerAccountsTooltip';
import { EarnYieldClaimRewardsBannerTokensTooltip } from './EarnYieldClaimRewardsBannerTokensTooltip';
import { useYieldClaimRewardsData } from './hooks/useYieldClaimRewardsData';
import { type useMerklRewards } from '../../yield/claim/hooks';

type EarnYieldClaimRewardsBannerProps = {
    rewards: ReturnType<typeof useMerklRewards>['merklRewardsQuery'];
    isClaimDisabled?: boolean;
    claimDisabledTooltip?: React.ReactNode;
    onClaim?: () => void;
};

export const EarnYieldClaimRewardsBanner = ({
    rewards,
    isClaimDisabled,
    claimDisabledTooltip,
    onClaim,
}: EarnYieldClaimRewardsBannerProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { value, currency } = rewards.data.totalRewardsToClaim;
    const { isLoading } = rewards;

    const { accountRewards, tokenRewards } = useYieldClaimRewardsData({ rewards });

    const handleOnClaim = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'claim-select-account-modal',
            },
        });

        onClaim?.();
    };

    return (
        <Banner
            intent="neutral"
            icon={HandCoinsIcon}
            description={
                <Row gap={12} alignItems="center">
                    <Text intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_CLAIM_REWARDS_LABEL" />:
                    </Text>

                    {isLoading || isDiscoveryRunning ? (
                        <Skeleton width={50} height={16} animate />
                    ) : (
                        <>
                            <Text typographyStyle="body-sm-strong">
                                {!isClaimDisabled && '≈ '}
                                <BaseCurrencyAmountFormatter value={value} currency={currency} />
                            </Text>

                            {tokenRewards.length > 0 && (
                                <EarnYieldClaimRewardsBannerTokensTooltip
                                    rewards={tokenRewards}
                                    currency={currency}
                                />
                            )}

                            {accountRewards.length > 1 && (
                                <EarnYieldClaimRewardsBannerAccountsTooltip
                                    rewards={accountRewards}
                                    currency={currency}
                                />
                            )}
                        </>
                    )}
                </Row>
            }
            rightContent={
                <Tooltip content={claimDisabledTooltip}>
                    <Banner.Button
                        isDisabled={isClaimDisabled || isDiscoveryRunning}
                        iconLeft={claimDisabledTooltip ? InfoIcon : undefined}
                        onClick={handleOnClaim}
                    >
                        <Translation id="TR_EARN_CLAIM_REWARDS_BUTTON" />
                    </Banner.Button>
                </Tooltip>
            }
        />
    );
};
