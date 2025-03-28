import { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { AnimatedBox, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useDebouncedValue } from '@trezor/react-utils';

import { AmountEditingDoneButton } from './AmountEditingDoneButton';
import { BuyCard } from './BuyCard';
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
            {!isAmountInputActiveDebounced && (
                <AnimatedBox entering={FadeInUp} exiting={FadeOutUp}>
                    <Text variant="titleSmall" color="textDefault">
                        <Translation id="moduleTrading.tradingScreen.buyTitle" />
                    </Text>
                </AnimatedBox>
            )}
            <BuyCard form={buyForm} />
            {isAmountInputActiveDebounced && <AmountEditingDoneButton />}
            {!isAmountInputActiveDebounced && <PaymentCard form={buyForm} />}
            {!isAmountInputActiveDebounced && <Confirmation />}
            {!isAmountInputActiveDebounced && <TradingFooter />}
        </VStack>
    );
};
