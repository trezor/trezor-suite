import { Dimensions } from 'react-native';

import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';

const SKELETON_WIDTH = Dimensions.get('window').width * 0.9;

export const BuyFormSkeleton = () => (
    <VStack alignItems="center" spacing="sp16">
        <Card noPadding>
            <BoxSkeleton width={SKELETON_WIDTH} height={240} borderRadius="r16" />
        </Card>
        <Card noPadding>
            <BoxSkeleton width={SKELETON_WIDTH} height={200} borderRadius="r16" />
        </Card>
        <BoxSkeleton width={SKELETON_WIDTH} height={50} borderRadius="r20" />
    </VStack>
);
