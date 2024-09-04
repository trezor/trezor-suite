import { BoxSkeleton, HStack } from '@suite-native/atoms';

import { EmptyAmountText } from './EmptyAmountText';

export const EmptyAmountSkeleton = () => {
    // Usage of EmptyAmountText ensures the correct line height.
    return (
        <HStack alignItems="center">
            <EmptyAmountText />
            <BoxSkeleton width={48} height={20} />
        </HStack>
    );
};
