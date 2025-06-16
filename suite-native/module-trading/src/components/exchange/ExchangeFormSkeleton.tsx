import { Card, VStack } from '@suite-native/atoms';

import { SkeletonLargeRow } from '../general/Skeleton/SkeletonLargeRow';
import { SkeletonSmall } from '../general/Skeleton/SkeletonSmall';

export const ExchangeFormSkeleton = () => (
    <>
        <Card>
            <VStack>
                <SkeletonSmall widthPercentage={0.2} />
                <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.35} />
            </VStack>
        </Card>
        <Card>
            <VStack>
                <SkeletonSmall widthPercentage={0.2} />
                <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.3} />
            </VStack>
        </Card>
    </>
);
