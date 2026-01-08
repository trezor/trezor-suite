import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedBox, Card, HStack, VStack } from '@suite-native/atoms';
import { SkeletonLarge, SkeletonSmall } from '@suite-native/trading-atoms';

export const ReviewOutputsSkeleton = () => (
    <AnimatedBox entering={FadeIn} exiting={FadeOut} testID="@trading/outputs-review/skeleton">
        <VStack spacing="sp32">
            <Card>
                <VStack spacing="sp16">
                    <SkeletonSmall widthPercentage={0.3} />
                    <SkeletonLarge widthPercentage={0.8} />
                </VStack>
            </Card>
            <Card>
                <VStack spacing="sp16">
                    <SkeletonSmall widthPercentage={0.5} />
                    <SkeletonLarge widthPercentage={0.8} />
                    <HStack justifyContent="space-between" alignItems="center">
                        <SkeletonSmall widthPercentage={0.3} />
                        <SkeletonSmall widthPercentage={0.4} />
                    </HStack>
                    <SkeletonSmall widthPercentage={0.3} />
                </VStack>
            </Card>
        </VStack>
    </AnimatedBox>
);
