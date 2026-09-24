import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { BannerInline, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useMessageSystemYield } from '../../hooks/yield/useMessageSystemYield';
import { type YieldClaimListItem, type YieldClaimToken } from '../../types';
import { EarnClaimTokenIconSet } from '../earn/EarnClaimTokenIconSet';

type YieldClaimRewardsSummaryCardProps = {
    claimItems: YieldClaimListItem[];
    claimTokens: YieldClaimToken[];
    totalClaimableFiatAmount: BaseCurrencyAmount | null;
    isLoading: boolean;
    onClaimRewardsPress: () => void;
};

export const YieldClaimRewardsSummaryCard = ({
    claimItems,
    claimTokens,
    totalClaimableFiatAmount,
    isLoading,
    ...rest
}: YieldClaimRewardsSummaryCardProps) => {
    const { analytics } = useServices(injectNativeAnalytics);

    const {
        isDisabled: isClaimFeatureDisabled,
        content: claimDisabledContent,
        variant: claimDisabledVariant,
    } = useMessageSystemYield('claim');

    const firstToken = claimTokens[0];

    const isClaimDisabled = claimItems.length === 0 || isLoading || isClaimFeatureDisabled;

    const onClaimRewardsPress = () => {
        if (isClaimDisabled) return;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: { element: 'earn-dashboard-claim-rewards' },
        });

        rest.onClaimRewardsPress();
    };

    return (
        <VStack spacing="sp12" padding="sp16">
            {isClaimFeatureDisabled && claimDisabledContent && (
                <BannerInline
                    intent={claimDisabledVariant ?? 'warning'}
                    title={claimDisabledContent}
                />
            )}

            <HStack spacing="sp24" alignItems="center">
                <VStack spacing="sp4" flex={1}>
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="earn.earnScreen.depositsCard.availableRewards" />
                    </Text>

                    <HStack spacing="sp4" alignItems="center" flexWrap="wrap">
                        {!isLoading && totalClaimableFiatAmount !== null ? (
                            <Text variant="body-md-strong">
                                {'≈ '}
                                <BaseCurrencyAmountFormatter
                                    value={totalClaimableFiatAmount}
                                    variant="body-md-strong"
                                    isDiscreetText={false}
                                />
                            </Text>
                        ) : (
                            <BaseCurrencyAmountFormatter
                                value={totalClaimableFiatAmount}
                                variant="body-md-strong"
                                isDiscreetText={false}
                                isLoading={isLoading}
                            />
                        )}

                        {!isLoading && firstToken && (
                            <Translation
                                id="earn.earnScreen.depositsCard.rewardsSummary"
                                values={{
                                    tokenCount: claimTokens.length,
                                    tokenSymbol: firstToken.symbol,
                                    accountCount: claimItems.length,
                                    text: chunks => (
                                        <Text variant="body-sm" color="contentSecondary">
                                            {chunks}
                                        </Text>
                                    ),
                                    tokenIcons: () => (
                                        <EarnClaimTokenIconSet tokens={claimTokens} />
                                    ),
                                    accountIcon: () => (
                                        <Icon name="wallet" size="small" color="contentSecondary" />
                                    ),
                                }}
                            />
                        )}
                    </HStack>
                </VStack>

                <Button
                    size="medium"
                    intent="brand"
                    priority="secondary"
                    isDisabled={isClaimDisabled}
                    isLoading={isLoading}
                    onPress={onClaimRewardsPress}
                >
                    <Translation id="earn.earnScreen.depositsCard.claimRewardsButton" />
                </Button>
            </HStack>
        </VStack>
    );
};
