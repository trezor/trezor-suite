import { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { AnimatedBox, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type BuyHeaderProps = {
    isFormMountedRecently?: boolean;
};

export const BuyHeader = ({ isFormMountedRecently }: BuyHeaderProps) => (
    <AnimatedBox entering={isFormMountedRecently ? undefined : FadeInUp} exiting={FadeOutUp}>
        <Text variant="titleSmall" color="textDefault">
            <Translation id="moduleTrading.tradingScreen.buyTitle" />
        </Text>
    </AnimatedBox>
);
