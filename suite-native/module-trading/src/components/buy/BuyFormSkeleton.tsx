import { Card, VStack } from '@suite-native/atoms';

import { SkeletonLargeRow } from '../general/Skeleton/SkeletonLargeRow';
import { SkeletonSmall } from '../general/Skeleton/SkeletonSmall';

export const BuyFormSkeleton = () => (
    <VStack spacing="sp16">
        <Card>
            <VStack>
                <SkeletonSmall widthPercentage={0.2} />
                <SkeletonLargeRow leftWidthPercentage={0.3} rightWidthPercentage={0.35} />
                <SkeletonSmall widthPercentage={0.25} />
                <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.3} />
            </VStack>
        </Card>
        <Card>
            <SkeletonLargeRow leftWidthPercentage={0.35} rightWidthPercentage={0.35} />
        </Card>
    </VStack>
);
