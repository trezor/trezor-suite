import { memo } from 'react';
import { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, Card, VStack } from '@suite-native/atoms';
import { AmountEditingDoneButton } from '@suite-native/trading-atoms';

import { ExchangeAlert } from './ExchangeAlert';
import { ExchangeConfirmation } from './ExchangeConfirmation';
import { ExchangeRateAndProviderPicker } from './ExchangeRateAndProviderPicker';
import { ExchangeReceiveAccountPicker } from './receive/ExchangeReceiveAccountPicker';
import { ExchangeReceiveCard } from './receive/ExchangeReceiveCard';
import { ExchangeSendCard } from './send/ExchangeSendCard';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeQuotes } from '../../hooks/exchange/useExchangeQuotes';
import { useFocusedValueWatch } from '../../hooks/general/useFocusedValueWatch';
import { useMountedRecentlyFlag } from '../../hooks/general/useMountedRecentlyFlag';

type ExchangeFormProps = {
    shouldAnimateEntering?: boolean;
};

type ExchangeFormMemoizedProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const EXCHANGE_FORM_TEST_ID = '@trading/exchange/form';
const AMOUNT_EDITING_DONE_BUTTON_TEST_ID = '@trading/exchange/amount-editing-done-button';

const getEnteringAnimation = (isFormMountedRecently?: boolean, shouldAnimateEntering?: boolean) => {
    if (!isFormMountedRecently) {
        return FadeInDown;
    }

    return shouldAnimateEntering ? FadeIn : undefined;
};

const ExchangeFormMemoized = memo(
    ({ isAmountInputActive, shouldAnimateEntering }: ExchangeFormMemoizedProps) => {
        const isFormMountedRecently = useMountedRecentlyFlag();

        const enteringAnimation = getEnteringAnimation(
            isFormMountedRecently,
            shouldAnimateEntering,
        );

        return (
            <AnimatedBox layout={LinearTransition}>
                <VStack spacing="sp16" testID={EXCHANGE_FORM_TEST_ID}>
                    <ExchangeAlert />
                    <ExchangeSendCard isAmountInputActive={isAmountInputActive} />
                    <ExchangeReceiveCard />
                    {isAmountInputActive ? (
                        <AmountEditingDoneButton testID={AMOUNT_EDITING_DONE_BUTTON_TEST_ID} />
                    ) : (
                        <>
                            <Card noPadding>
                                <ExchangeReceiveAccountPicker />
                                <ExchangeRateAndProviderPicker />
                            </Card>
                            <ExchangeConfirmation enteringAnimation={enteringAnimation} />
                        </>
                    )}
                </VStack>
            </AnimatedBox>
        );
    },
);

export const ExchangeForm = ({ shouldAnimateEntering }: ExchangeFormProps) => {
    const exchangeForm = useExchangeFormContext();
    const isAmountInputActiveDebounced = useFocusedValueWatch(exchangeForm.watch);
    useExchangeQuotes(exchangeForm);

    return (
        <ExchangeFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
