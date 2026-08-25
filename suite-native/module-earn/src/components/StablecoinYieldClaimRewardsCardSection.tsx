import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerInline, Box, Button, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { EarnClaimTokenIconSet } from './EarnClaimTokenIconSet';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { type StablecoinYieldClaimSummary } from '../types';
import { getUniqueStablecoinYieldClaimTokens } from '../utils/stablecoinYieldClaimSummaryUtils';

type StablecoinYieldClaimRewardsCardSectionProps = {
    claimRewards: StablecoinYieldClaimSummary[];
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
    isLoading: boolean;
    hasTopDivider: boolean;
    onPress: () => void;
};

export const StablecoinYieldClaimRewardsCardSection = ({
    claimRewards,
    totalFiatClaimableAmount,
    isLoading,
    hasTopDivider,
    onPress,
}: StablecoinYieldClaimRewardsCardSectionProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const {
        isDisabled: isClaimFeatureDisabled,
        content: claimDisabledContent,
        variant: claimDisabledVariant,
    } = useMessageSystemYield('claim');
    const isDisabled = claimRewards.length === 0 || isLoading || isClaimFeatureDisabled;
    const tokens = useMemo(() => getUniqueStablecoinYieldClaimTokens(claimRewards), [claimRewards]);
    const firstToken = tokens[0];

    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handlePress = useCallback(() => {
        if (isDisabled) {
            return;
        }

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'earn-dashboard-claim-rewards',
            },
        });

        onPress();
    }, [isDisabled, onPress, analytics]);

    if (isPortfolioTrackerDevice || (claimRewards.length === 0 && !isLoading)) {
        return null;
    }

    return (
        <Box>
            {hasTopDivider && <Divider />}
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
                                    <>
                                        <Text variant="body-sm" color="contentSecondary">
                                            <Translation id="earn.earnScreen.depositsCard.in" />
                                        </Text>
                                        <HStack spacing="sp4" alignItems="center">
                                            <EarnClaimTokenIconSet tokens={tokens} />
                                            <Text variant="body-sm" color="contentSecondary">
                                                {tokens.length === 1 ? (
                                                    firstToken.symbol
                                                ) : (
                                                    <Translation
                                                        id="earn.earnScreen.depositsCard.tokens"
                                                        values={{ count: tokens.length }}
                                                    />
                                                )}
                                            </Text>
                                        </HStack>
                                        {claimRewards.length > 1 && (
                                            <>
                                                <Text variant="body-sm" color="contentSecondary">
                                                    <Translation id="earn.earnScreen.depositsCard.in" />
                                                </Text>
                                                <HStack spacing="sp4" alignItems="center">
                                                    <Icon
                                                        name="wallet"
                                                        size="small"
                                                        color="contentSecondary"
                                                    />
                                                    <Text
                                                        variant="body-sm"
                                                        color="contentSecondary"
                                                    >
                                                        <Translation
                                                            id="earn.earnScreen.depositsCard.accounts"
                                                            values={{ count: claimRewards.length }}
                                                        />
                                                    </Text>
                                                </HStack>
                                            </>
                                        )}
                                    </>
                                )}
                            </HStack>
                        </VStack>
                        <Button
                            size="medium"
                            intent="brand"
                            priority="secondary"
                            isDisabled={isDisabled}
                            isLoading={isLoading}
                            onPress={handlePress}
                        >
                            <Translation id="earn.earnScreen.depositsCard.claimRewardsButton" />
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
};
