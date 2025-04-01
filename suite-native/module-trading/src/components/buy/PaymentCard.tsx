import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Card } from '@suite-native/atoms';

import { CountryOfResidencePicker } from './CountryOfResidencePicker';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { TradingProviderPicker } from './TradingProviderPicker';

export const PaymentCard = () => (
    <AnimatedBox entering={FadeInDown} exiting={FadeOutDown}>
        <Card noPadding>
            <PaymentMethodPicker />
            <CountryOfResidencePicker />
            <TradingProviderPicker />
        </Card>
    </AnimatedBox>
);
