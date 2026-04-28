import { memo } from 'react';
import { Platform } from 'react-native';
import {
    FadeInUp,
    FadeOutUp,
    LinearTransition,
    StretchInY,
    StretchOutY,
} from 'react-native-reanimated';

import { AnimatedBox, Card, VStack } from '@suite-native/atoms';
import { AmountEditingDoneButton } from '@suite-native/trading-atoms';

import { ExchangeAlert } from './ExchangeAlert';
import { ExchangeCard } from './ExchangeCard';
import { ExchangeConfirmation } from './ExchangeConfirmation';
import { ExchangeRateAndProviderPicker } from './ExchangeRateAndProviderPicker';
import { ExchangeReceiveAccountPicker } from './receive/ExchangeReceiveAccountPicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeQuotes } from '../../hooks/exchange/useExchangeQuotes';
import { useFocusedValueWatch } from '../../hooks/general/useFocusedValueWatch';

type ExchangeFormMemoizedProps = {
    isAmountInputActive: boolean;
};

const EXCHANGE_FORM_TEST_ID = '@trading/exchange/form';
const AMOUNT_EDITING_DONE_BUTTON_TEST_ID = '@trading/exchange/amount-editing-done-button';

const cardEnteringAnimation = Platform.OS === 'android' ? StretchInY : FadeInUp;
const cardExitingAnimation = Platform.OS === 'android' ? StretchOutY : FadeOutUp;

const ExchangeFormMemoized = memo(({ isAmountInputActive }: ExchangeFormMemoizedProps) => (
    <AnimatedBox layout={LinearTransition}>
        <VStack spacing="sp16" testID={EXCHANGE_FORM_TEST_ID}>
            <ExchangeAlert />
            <ExchangeCard isAmountInputActive={isAmountInputActive} />
            {isAmountInputActive ? (
                <AmountEditingDoneButton testID={AMOUNT_EDITING_DONE_BUTTON_TEST_ID} />
            ) : (
                <>
                    <AnimatedBox
                        layout={LinearTransition}
                        entering={cardEnteringAnimation}
                        exiting={cardExitingAnimation}
                    >
                        <Card noPadding>
                            <ExchangeReceiveAccountPicker />
                            <ExchangeRateAndProviderPicker />
                        </Card>
                    </AnimatedBox>
                    <ExchangeConfirmation />
                </>
            )}
        </VStack>
    </AnimatedBox>
));

export const ExchangeForm = () => {
    const exchangeForm = useExchangeFormContext();
    const isAmountInputActiveDebounced = useFocusedValueWatch(exchangeForm.watch);
    useExchangeQuotes(exchangeForm);

    return <ExchangeFormMemoized isAmountInputActive={isAmountInputActiveDebounced} />;
};
