import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectNativeAnalytics } from '@suite-native/analytics';
import {
    BannerInline,
    Button,
    CardDivider,
    HStack,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardsBottomSheet } from './YieldClaimRewardsBottomSheet';
import {
    type EarnListRootState,
    selectYieldClaimAccountItems,
    selectYieldClaimListItems,
    selectYieldClaimTokens,
    selectYieldClaimTotalFiatAmount,
    selectYieldListItems,
} from '../../earnScreenSelectors';
import { useClaimRewardsWithFiat } from '../../hooks/yield/useClaimRewardsWithFiat';
import { useMessageSystemYield } from '../../hooks/yield/useMessageSystemYield';
import { useStablecoinYieldFirmwareUpdateAlert } from '../../hooks/yield/useStablecoinYieldFirmwareUpdateAlert';
import { useYieldOpportunities } from '../../hooks/yield/useYieldOpportunities';
import { EarnClaimTokenIconSet } from '../earn/EarnClaimTokenIconSet';

export const YieldClaimRewardsSummaryCard = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();

    const {
        isDisabled: isClaimFeatureDisabled,
        content: claimDisabledContent,
        variant: claimDisabledVariant,
    } = useMessageSystemYield('claim');

    const { yieldOpportunities } = useYieldOpportunities();

    const positions = useSelector((state: EarnListRootState) =>
        selectYieldListItems(state, yieldOpportunities),
    );

    const { claimRewardsWithFiat, isClaimLoading } = useClaimRewardsWithFiat();

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const claimTokens = useSelector((state: EarnListRootState) =>
        selectYieldClaimTokens(state, claimRewardsWithFiat),
    );

    const claimAccountItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimAccountItems(state, claimRewardsWithFiat, yieldOpportunities),
    );

    const totalClaimableFiatAmount = useSelector((state: EarnListRootState) =>
        selectYieldClaimTotalFiatAmount(state, claimRewardsWithFiat),
    );

    const {
        bottomSheetRef: yieldClaimRewardsSheetRef,
        openModal: openYieldClaimRewardsSheet,
        closeModal: closeYieldClaimRewardsSheet,
    } = useBottomSheetModal();

    const firstToken = claimTokens[0];

    const isClaimDisabled = claimItems.length === 0 || isClaimLoading || isClaimFeatureDisabled;

    const onClaimRewardsPress = () => {
        if (isClaimDisabled) return;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: { element: 'earn-dashboard-claim-rewards' },
        });

        if (!isFirmwareSupported('claim')) {
            showFirmwareUpdateAlert();

            return;
        }

        openYieldClaimRewardsSheet();
    };

    return (
        <>
            {positions.length > 0 && <CardDivider horizontalPadding={0} />}

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
                            {!isClaimLoading && totalClaimableFiatAmount !== null ? (
                                <Text variant="body-md-strong">
                                    {'≈\u00A0'}
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
                                    isLoading={isClaimLoading}
                                />
                            )}

                            {!isClaimLoading && firstToken && (
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
                        isDisabled={isClaimDisabled}
                        isLoading={isClaimLoading}
                        onPress={onClaimRewardsPress}
                    >
                        <Translation id="earn.earnScreen.depositsCard.claimRewardsButton" />
                    </Button>
                </HStack>
            </VStack>

            <YieldClaimRewardsBottomSheet
                ref={yieldClaimRewardsSheetRef}
                items={claimAccountItems}
                onClose={closeYieldClaimRewardsSheet}
            />
        </>
    );
};
