import { memo, useEffect, useState } from 'react';

import { VStack } from '@suite-native/atoms';
import { useDebouncedValue } from '@trezor/react-utils';

import { AmountEditingDoneButton } from './AmountEditingDoneButton';
import { BuyCard } from './BuyCard';
import { BuyHeader } from './BuyHeader';
import { Confirmation } from './Confirmation';
import { PaymentCard } from './PaymentCard';
import { useQuotes } from '../../hooks/useQuotes';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { TradeHistoryButton } from '../general/TradeHistory/TradeHistoryButton';
import { TradingAlert } from '../general/TradingAlert';
import { TradingFooter } from '../general/TradingFooter';

const BuyFormMemoized = memo(({ isAmountInputActive }: { isAmountInputActive: boolean }) => {
    // `isFormMountedRecently`  allows to use different animations for initial form load (FadeIn)
    // and when user interacts with the form (FadeInUp/FadeInDown)
    const [isFormMountedRecently, setFormMountedRecently] = useState<boolean>(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFormMountedRecently(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <VStack spacing="sp16">
            {!isAmountInputActive && <BuyHeader isFormMountedRecently={isFormMountedRecently} />}
            <TradingAlert />
            <BuyCard isAmountInputActive={isAmountInputActive} />
            {isAmountInputActive ? (
                <AmountEditingDoneButton />
            ) : (
                <>
                    <PaymentCard isFormMountedRecently={isFormMountedRecently} />
                    <Confirmation isFormMountedRecently={isFormMountedRecently} />
                    <TradingFooter isFormMountedRecently={isFormMountedRecently} />
                    <TradeHistoryButton
                        tradeType="buy"
                        isFormMountedRecently={isFormMountedRecently}
                    />
                </>
            )}
        </VStack>
    );
});

export const BuyForm = () => {
    const buyForm = useTradingBuyFormContext();
    useQuotes(buyForm);

    const isAmountInputActive = !!buyForm.watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    return <BuyFormMemoized isAmountInputActive={isAmountInputActiveDebounced} />;
};
