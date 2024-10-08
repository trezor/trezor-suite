import { Dimensions } from 'react-native';

import { BoxSkeleton, HStack } from '@suite-native/atoms';

import { EmptyAmountText } from './EmptyAmountText';

const SKELETON_WIDTH = 0.2 * Dimensions.get('window').width;

export const EmptyAmountSkeleton = () => {
    // Usage of EmptyAmountText ensures the correct line height.
    return (
        <HStack alignItems="center">
            <EmptyAmountText />
            <BoxSkeleton width={SKELETON_WIDTH} height={20} borderRadius="r4" />
        </HStack>
    );
};
