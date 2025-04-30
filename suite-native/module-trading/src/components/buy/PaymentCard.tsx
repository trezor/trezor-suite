import { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Card } from '@suite-native/atoms';

import { CountryOfResidencePicker } from './CountryOfResidencePicker';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { TradingProviderPicker } from './TradingProviderPicker';

export type PaymentCardProps = {
    isFormMountedRecently?: boolean;
};

export const PaymentCard = ({ isFormMountedRecently }: PaymentCardProps) => (
    <AnimatedBox entering={isFormMountedRecently ? FadeIn : FadeInDown} exiting={FadeOutDown}>
        <Card noPadding>
            <PaymentMethodPicker />
            <CountryOfResidencePicker />
            <TradingProviderPicker />
        </Card>
    </AnimatedBox>
);
