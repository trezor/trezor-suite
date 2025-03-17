import { VStack } from '@suite-native/atoms';

import { BuyCard } from './BuyCard';
import { Confirmation } from './Confirmation';
import { PaymentCard } from './PaymentCard';
import { useTradingBuyForm } from '../../hooks/useTradingBuyForm';

export const BuyForm = () => {
    const buyForm = useTradingBuyForm();

    return (
        <VStack spacing="sp16">
            <BuyCard form={buyForm} />
            <PaymentCard form={buyForm} />
            <Confirmation />
        </VStack>
    );
};
