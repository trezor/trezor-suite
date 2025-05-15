import { Dimensions } from 'react-native';

import { BoxSkeleton, Card, HStack, VStack } from '@suite-native/atoms';

import { BuyHeader } from './BuyHeader';
import { TradingFooter } from '../general/TradingFooter';

const SKELETON_LARGE_HEIGHT = 60;
const SKELETON_SMALL_HEIGHT = 20;

type SkeletonProps = {
    widthPercentage: number;
};

type SkeletonRowProps = {
    leftWidthPercentage: number;
    rightWidthPercentage: number;
};

const SkeletonSmall = ({ widthPercentage }: SkeletonProps) => (
    <BoxSkeleton
        width={Dimensions.get('window').width * widthPercentage}
        height={SKELETON_SMALL_HEIGHT}
    />
);

const SkeletonLarge = ({ widthPercentage }: SkeletonProps) => (
    <BoxSkeleton
        width={Dimensions.get('window').width * widthPercentage}
        height={SKELETON_LARGE_HEIGHT}
        borderRadius="r16"
    />
);

const SkeletonLargeRow = ({ leftWidthPercentage, rightWidthPercentage }: SkeletonRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <SkeletonLarge widthPercentage={leftWidthPercentage} />
        <SkeletonLarge widthPercentage={rightWidthPercentage} />
    </HStack>
);

export const BuyFormSkeleton = () => (
    <VStack spacing="sp16" paddingTop="sp16">
        <BuyHeader isFormMountedRecently={true} />
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
        <TradingFooter />
    </VStack>
);
