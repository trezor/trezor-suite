import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerInline, Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { EarnClaimTokenIconSet } from './EarnClaimTokenIconSet';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { type YieldClaimSummary } from '../types';
import { getUniqueStablecoinYieldClaimTokens } from '../utils/stablecoinYieldClaimSummaryUtils';

interface YieldClaimRewardsCardSectionProps {
    claimRewards: YieldClaimSummary[];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
    isLoading: boolean;
    onPress: () => void;
}

export const YieldClaimRewardsCardSection = ({
    claimRewards,
    totalFiatClaimableAmount,
    isLoading,
    onPress,
}: YieldClaimRewardsCardSectionProps) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const {
        isDisabled: isClaimFeatureDisabled,
        content: claimDisabledContent,
        variant: claimDisabledVariant,
    } = useMessageSystemYield('claim');

    const isDisabled = claimRewards.length === 0 || isLoading || isClaimFeatureDisabled;

    const tokens = getUniqueStablecoinYieldClaimTokens(claimRewards);
    const firstToken = tokens[0];

    const onClaimRewardsPress = useCallback(() => {
        if (isDisabled) return;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'earn-dashboard-claim-rewards',
            },
        });

        onPress();
    }, [isDisabled, analytics, onPress]);

    return (
        <Box padding="sp16">
            <VStack spacing="sp12">
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
                            {!isLoading && totalFiatClaimableAmount !== null ? (
                                <Text variant="body-md-strong">
                                    {'≈\u00A0'}
                                    <BaseCurrencyAmountFormatter
                                        value={totalFiatClaimableAmount}
                                        variant="body-md-strong"
                                        isDiscreetText={false}
                                    />
                                </Text>
                            ) : (
                                <BaseCurrencyAmountFormatter
                                    value={totalFiatClaimableAmount}
                                    variant="body-md-strong"
                                    isDiscreetText={false}
                                    isLoading={isLoading}
                                />
                            )}
                            {!isLoading && firstToken && (
                                <Translation
                                    id="earn.earnScreen.depositsCard.rewardsSummary"
                                    values={{
                                        tokenCount: tokens.length,
                                        tokenSymbol: firstToken.symbol,
                                        accountCount: claimRewards.length,
                                        text: chunks => (
                                            <Text variant="body-sm" color="contentSecondary">
                                                {chunks}
                                            </Text>
                                        ),
                                        tokenIcons: () => <EarnClaimTokenIconSet tokens={tokens} />,
                                        accountIcon: () => (
                                            <Icon
                                                name="wallet"
                                                size="small"
                                                color="contentSecondary"
                                            />
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
                        isDisabled={isDisabled}
                        isLoading={isLoading}
                        onPress={onClaimRewardsPress}
                    >
                        <Translation id="earn.earnScreen.depositsCard.claimRewardsButton" />
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};
