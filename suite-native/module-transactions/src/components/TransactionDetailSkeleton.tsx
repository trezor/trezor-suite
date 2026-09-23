import { Dimensions } from 'react-native';

import { BoxSkeleton, VStack } from '@suite-native/atoms';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const TransactionDetailSkeleton = () => (
    <VStack spacing="sp24">
        <BoxSkeleton width={160} height={32} />
        <BoxSkeleton width={SCREEN_WIDTH - 32} height={112} />
        <BoxSkeleton width={SCREEN_WIDTH - 32} height={240} />
    </VStack>
);
