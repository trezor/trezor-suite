import { VStack } from '@suite-native/atoms';
import { useDebouncedValue } from '@trezor/react-utils';

import { AmountEditingDoneButton } from './AmountEditingDoneButton';
import { BuyCard } from './BuyCard';
import { BuyHeader } from './BuyHeader';
import { Confirmation } from './Confirmation';
import { PaymentCard } from './PaymentCard';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { TradingFooter } from '../general/TradingFooter';

export const BuyForm = () => {
    const buyForm = useTradingBuyFormContext();
    const isAmountInputActive = !!buyForm.watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    return (
        <VStack spacing="sp16">
            {!isAmountInputActiveDebounced && <BuyHeader />}
            <BuyCard form={buyForm} isAmountInputActive={isAmountInputActiveDebounced} />
            {isAmountInputActiveDebounced ? (
                <AmountEditingDoneButton />
            ) : (
                <>
                    <PaymentCard form={buyForm} />
                    <Confirmation />
                    <TradingFooter />
                </>
            )}
        </VStack>
    );
};
