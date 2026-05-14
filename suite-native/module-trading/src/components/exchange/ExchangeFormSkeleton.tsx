import { Card, VStack } from '@suite-native/atoms';
import { SkeletonLargeRow, SkeletonSmall } from '@suite-native/trading-atoms';

export const ExchangeFormSkeleton = () => (
    <>
        <Card>
            <VStack spacing="sp16">
                <VStack>
                    <SkeletonSmall widthPercentage={0.2} />
                    <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.35} />
                </VStack>
                <VStack>
                    <SkeletonSmall widthPercentage={0.2} />
                    <SkeletonLargeRow leftWidthPercentage={0.4} rightWidthPercentage={0.3} />
                </VStack>
            </VStack>
        </Card>
    </>
);
