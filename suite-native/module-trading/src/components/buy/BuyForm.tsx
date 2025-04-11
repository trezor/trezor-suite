import { memo } from 'react';

import { VStack } from '@suite-native/atoms';
import { useDebouncedValue } from '@trezor/react-utils';

import { AmountEditingDoneButton } from './AmountEditingDoneButton';
import { BuyCard } from './BuyCard';
import { BuyHeader } from './BuyHeader';
import { Confirmation } from './Confirmation';
import { PaymentCard } from './PaymentCard';
import { useQuotes } from '../../hooks/useQuotes';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { TradingAlert } from '../general/TradingAlert';
import { TradingFooter } from '../general/TradingFooter';

const BuyFormMemoized = memo(({ isAmountInputActive }: { isAmountInputActive: boolean }) => (
    <VStack spacing="sp16">
        {!isAmountInputActive && <BuyHeader />}
        <TradingAlert />
        <BuyCard isAmountInputActive={isAmountInputActive} />
        {isAmountInputActive ? (
            <AmountEditingDoneButton />
        ) : (
            <>
                <PaymentCard />
                <Confirmation />
                <TradingFooter />
            </>
        )}
    </VStack>
));

export const BuyForm = () => {
    const buyForm = useTradingBuyFormContext();
    useQuotes(buyForm);

    const isAmountInputActive = !!buyForm.watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    return <BuyFormMemoized isAmountInputActive={isAmountInputActiveDebounced} />;
};
