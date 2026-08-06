import { BoxSkeleton, VStack } from '@suite-native/atoms';

export const GraphBaseCurrencyBalanceSkeleton = () => (
    <VStack alignItems="center" spacing="sp8">
        <BoxSkeleton elevation="0" width={180} height={44} />
        <BoxSkeleton elevation="0" width={140} height={20} />
    </VStack>
);
