import { useSelector } from 'react-redux';

import { Card, VStack } from '@suite-native/atoms';
import { SkeletonLargeRow, SkeletonSmall } from '@suite-native/trading-atoms';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';

export const BuyFormSkeleton = () => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    return (
        <VStack spacing="sp16">
            <Card>
                <VStack>
                    <SkeletonSmall widthPercentage={0.2} />
                    <SkeletonLargeRow leftWidthPercentage={0.3} rightWidthPercentage={0.35} />
                    <SkeletonSmall widthPercentage={0.25} />
                    <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.3} />
                </VStack>
            </Card>
            {!isTradingResidenceCheckEnabled && (
                <Card>
                    <SkeletonLargeRow leftWidthPercentage={0.35} rightWidthPercentage={0.35} />
                </Card>
            )}
        </VStack>
    );
};
