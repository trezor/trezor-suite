import { Card, Text, VStack } from '@suite-native/atoms';

import { TradingDeeplinks } from './TradingDeeplinks';
import { TradingEnvironmentSelect } from './TradingEnvironmentSelect';

export const TradingCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="titleSmall">Trading</Text>
            <TradingEnvironmentSelect />
            <TradingDeeplinks />
        </VStack>
    </Card>
);
