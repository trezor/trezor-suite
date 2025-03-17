import { Card } from '@suite-native/atoms';

import { CountryOfResidencePicker } from './CountryOfResidencePicker';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { TradingProviderPicker } from './TradingProviderPicker';
import { TradingBuyForm } from '../../types';

export type PaymentCardProps = {
    form: TradingBuyForm;
};

export const PaymentCard = ({ form }: PaymentCardProps) => (
    <Card noPadding>
        <PaymentMethodPicker form={form} />
        <CountryOfResidencePicker form={form} />
        <TradingProviderPicker form={form} />
    </Card>
);
