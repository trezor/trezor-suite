import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Card } from '@suite-native/atoms';

import { CountryOfResidencePicker } from './CountryOfResidencePicker';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { TradingProviderPicker } from './TradingProviderPicker';
import { TradingBuyForm } from '../../types';

export type PaymentCardProps = {
    form: TradingBuyForm;
};

export const PaymentCard = ({ form }: PaymentCardProps) => (
    <AnimatedBox entering={FadeInDown} exiting={FadeOutDown}>
        <Card noPadding>
            <PaymentMethodPicker form={form} />
            <CountryOfResidencePicker form={form} />
            <TradingProviderPicker form={form} />
        </Card>
    </AnimatedBox>
);
