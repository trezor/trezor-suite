import { Dimensions } from 'react-native';

import { BoxSkeleton, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradingFooter } from '../general/TradingFooter';

const SKELETON_LARGE_WIDTH = Dimensions.get('window').width * 0.3;
const SKELETON_LARGE_HEIGHT = 60;
const SKELETON_SMALL_WIDTH = Dimensions.get('window').width * 0.2;
const SKELETON_SMALL_HEIGHT = 20;

const SkeletonSmall = () => (
    <BoxSkeleton width={SKELETON_SMALL_WIDTH} height={SKELETON_SMALL_HEIGHT} />
);

const SkeletonLarge = () => (
    <BoxSkeleton width={SKELETON_LARGE_WIDTH} height={SKELETON_LARGE_HEIGHT} borderRadius="r16" />
);

export const BuyFormSkeleton = () => (
    <VStack spacing="sp16">
        <Text variant="titleSmall" color="textDefault">
            <Translation id="moduleTrading.tradingScreen.buyTitle" />
        </Text>
        <VStack spacing="sp16">
            <Card>
                <VStack>
                    <SkeletonSmall />
                    <HStack justifyContent="space-between" alignItems="center">
                        <SkeletonLarge />
                        <SkeletonLarge />
                    </HStack>
                    <SkeletonSmall />
                    <HStack justifyContent="space-between" alignItems="center">
                        <SkeletonLarge />
                        <SkeletonLarge />
                    </HStack>
                </VStack>
            </Card>
            <Card>
                <HStack justifyContent="space-between" alignItems="center">
                    <SkeletonLarge />
                    <SkeletonLarge />
                </HStack>
            </Card>
        </VStack>
        <TradingFooter isFormMountedRecently={true} />
    </VStack>
);
