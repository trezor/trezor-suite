import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { HiddenPlaceholder } from '@suite/discreet-mode';
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
    isFiatRateLoading?: boolean;
    isClaimDisabled?: boolean;
    claimDisabledTooltip?: React.ReactNode;
    onClaim?: () => void;
};

export const EarnYieldClaimRewardsBanner = ({
    rewards,
    isFiatRateLoading,
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
    const areRewardsLoading = isLoading || isFiatRateLoading || isDiscoveryRunning;

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
            isIconVerticallyCentered
            contentGap={8}
            title={
                <Text intent="neutral" priority="secondary">
                    <Translation id="TR_EARN_CLAIM_REWARDS_LABEL" />
                </Text>
            }
            description={
                areRewardsLoading ? (
                    <Skeleton width={140} height={20} animate />
                ) : (
                    <Row gap={8} alignItems="center" flexWrap="wrap">
                        <Row gap={8} alignItems="center">
                            <HiddenPlaceholder>
                                <Text typographyStyle="body-md-strong">
                                    {!isClaimDisabled && '≈ '}
                                    <BaseCurrencyAmountFormatter
                                        value={value}
                                        currency={currency}
                                    />
                                </Text>
                            </HiddenPlaceholder>

                            <Text intent="neutral" priority="secondary">
                                <Translation id="TR_EARN_CLAIM_REWARDS_IN" />
                            </Text>

                            <EarnYieldClaimRewardsBannerTokensTooltip
                                rewards={tokenRewards}
                                currency={currency}
                            />
                        </Row>

                        {accountRewards.length > 1 && (
                            <Row gap={8} alignItems="center">
                                <Text intent="neutral" priority="secondary">
                                    <Translation id="TR_EARN_CLAIM_REWARDS_IN" />
                                </Text>

                                <EarnYieldClaimRewardsBannerAccountsTooltip
                                    rewards={accountRewards}
                                    currency={currency}
                                />
                            </Row>
                        )}
                    </Row>
                )
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
