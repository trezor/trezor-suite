import { useSelector } from 'react-redux';

import { Box, Card, VStack } from '@suite-native/atoms';
import { SkeletonLargeRow, SkeletonSmall } from '@suite-native/trading-atoms';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';

import { TradingCardSection } from './TradingCardSection';

export type TradingFormSkeletonProps = {
    hasResidenceField?: boolean;
};

export const TradingFormSkeleton = ({ hasResidenceField = false }: TradingFormSkeletonProps) => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    const isResidenceSkeletonVisible = hasResidenceField && !isTradingResidenceCheckEnabled;

    return (
        <VStack spacing="sp16">
            <Card noPadding>
                <TradingCardSection bottomBorder title={<SkeletonSmall widthPercentage={0.2} />}>
                    <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.35} />

                    <Box paddingVertical="sp12" />
                </TradingCardSection>
                <TradingCardSection bottomBorder title={<SkeletonSmall widthPercentage={0.2} />}>
                    <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.3} />
                </TradingCardSection>
            </Card>
            {isResidenceSkeletonVisible && (
                <Card>
                    <SkeletonLargeRow leftWidthPercentage={0.35} rightWidthPercentage={0.35} />
                </Card>
            )}
        </VStack>
    );
};
