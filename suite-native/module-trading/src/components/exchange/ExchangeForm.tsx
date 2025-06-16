import { memo } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, Card, VStack } from '@suite-native/atoms';

import { ExchangeAlert } from './ExchangeAlert';
import { ExchangeReceiveAccountPicker } from './receive/ExchangeReceiveAccountPicker';
import { ExchangeReceiveCard } from './receive/ExchangeReceiveCard';
import { ExchangeSendCard } from './send/ExchangeSendCard';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useFocusedValueWatch } from '../../hooks/general/useFocusedValueWatch';
import { AmountEditingDoneButton } from '../general/AmountEditingDoneButton';

type ExchangeFormProps = {
    shouldAnimateEntering?: boolean;
};

type ExchangeFormMemoizedProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const ExchangeFormMemoized = memo(({ isAmountInputActive }: ExchangeFormMemoizedProps) => (
    <AnimatedBox layout={LinearTransition}>
        <VStack spacing="sp16">
            <ExchangeAlert />
            <ExchangeSendCard isAmountInputActive={isAmountInputActive} />
            <ExchangeReceiveCard />
            {isAmountInputActive ? (
                <AmountEditingDoneButton />
            ) : (
                <Card noPadding>
                    <ExchangeReceiveAccountPicker />
                </Card>
            )}
        </VStack>
    </AnimatedBox>
));

export const ExchangeForm = ({ shouldAnimateEntering }: ExchangeFormProps) => {
    const exchangeForm = useExchangeFormContext();
    const isAmountInputActiveDebounced = useFocusedValueWatch(exchangeForm.watch);

    return (
        <ExchangeFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
