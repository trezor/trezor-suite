import styled from 'styled-components';

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

const Summary = styled.span`
    color: ${({ theme }) => theme.contentSecondary};

    > span {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
    }
`;

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
    const amountContent = (
        <HiddenPlaceholder>
            <Text typographyStyle="body-md-strong" intent="neutral" priority="primary">
                {!isClaimDisabled && '≈ '}
                <BaseCurrencyAmountFormatter value={value} currency={currency} />
            </Text>
        </HiddenPlaceholder>
    );

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
                        {tokenRewards.length === 0 ? (
                            amountContent
                        ) : (
                            <Summary>
                                {accountRewards.length > 1 ? (
                                    <Translation
                                        id="TR_EARN_CLAIM_REWARDS_SUMMARY_WITH_ACCOUNTS"
                                        values={{
                                            amount: amountContent,
                                            tokens: (
                                                <EarnYieldClaimRewardsBannerTokensTooltip
                                                    rewards={tokenRewards}
                                                    currency={currency}
                                                />
                                            ),
                                            accounts: (
                                                <EarnYieldClaimRewardsBannerAccountsTooltip
                                                    rewards={accountRewards}
                                                    currency={currency}
                                                />
                                            ),
                                            text: chunks => (
                                                <Text intent="neutral" priority="secondary">
                                                    {chunks}
                                                </Text>
                                            ),
                                        }}
                                    />
                                ) : (
                                    <Translation
                                        id="TR_EARN_CLAIM_REWARDS_SUMMARY"
                                        values={{
                                            amount: amountContent,
                                            tokens: (
                                                <EarnYieldClaimRewardsBannerTokensTooltip
                                                    rewards={tokenRewards}
                                                    currency={currency}
                                                />
                                            ),
                                            text: chunks => (
                                                <Text intent="neutral" priority="secondary">
                                                    {chunks}
                                                </Text>
                                            ),
                                        }}
                                    />
                                )}
                            </Summary>
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
