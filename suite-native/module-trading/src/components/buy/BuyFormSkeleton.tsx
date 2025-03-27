import { Dimensions } from 'react-native';

import { BoxSkeleton, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradingFooter } from '../general/TradingFooter';

const SKELETON_WIDTH = Dimensions.get('window').width * 0.9;

export const BuyFormSkeleton = () => (
    <VStack spacing="sp16">
        <Text variant="titleSmall" color="textDefault">
            <Translation id="moduleTrading.tradingScreen.buyTitle" />
        </Text>
        <VStack alignItems="center" spacing="sp16">
            <Card noPadding>
                <BoxSkeleton width={SKELETON_WIDTH} height={300} borderRadius="r16" />
            </Card>
            <Card noPadding>
                <BoxSkeleton width={SKELETON_WIDTH} height={200} borderRadius="r16" />
            </Card>
            <BoxSkeleton width={SKELETON_WIDTH} height={50} borderRadius="r20" />
        </VStack>
        <TradingFooter />
    </VStack>
);
