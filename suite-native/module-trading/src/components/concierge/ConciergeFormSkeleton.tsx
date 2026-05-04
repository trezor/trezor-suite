import { Card, VStack } from '@suite-native/atoms';
import { SkeletonLargeRow } from '@suite-native/trading-atoms';

import { ConciergeInfoCard } from './ConciergeInfoCard';

export const ConciergeFormSkeleton = () => (
    <VStack spacing="sp16">
        <ConciergeInfoCard />
        <Card>
            <SkeletonLargeRow leftWidthPercentage={0.35} rightWidthPercentage={0.35} />
        </Card>
    </VStack>
);
