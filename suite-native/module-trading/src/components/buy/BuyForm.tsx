import { memo, useEffect } from 'react';
import { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { AnimatedBox, VStack } from '@suite-native/atoms';
import { useDebouncedValue } from '@trezor/react-utils';

import { BuyAlert } from './BuyAlert';
import { BuyAmountEditingDoneButton } from './BuyAmountEditingDoneButton';
import { BuyCard } from './BuyCard';
import { BuyConfirmation } from './BuyConfirmation';
import { BuyPaymentCard } from './BuyPaymentCard';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyQuotes } from '../../hooks/buy/useBuyQuotes';
import { useMountedRecentlyFlag } from '../../hooks/general/useMountedRecentlyFlag';
import { tradingActions } from '../../tradingSlice';

type BuyFormProps = {
    shouldAnimateEntering?: boolean;
};

type BuyFormMemoizedProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const BUY_FORM_TEST_ID = '@trading/buy/form';

const getEnteringAnimationForItemsUnderBuyCard = (
    isFormMountedRecently?: boolean,
    shouldAnimateEntering?: boolean,
) => {
    if (!isFormMountedRecently) {
        return FadeInDown;
    }

    return shouldAnimateEntering ? FadeIn : undefined;
};

const BuyFormMemoized = memo(
    ({ isAmountInputActive, shouldAnimateEntering }: BuyFormMemoizedProps) => {
        // `isFormMountedRecently` allows to use different animations for initial form load (FadeIn)
        // and when user interacts with the form (FadeInUp/FadeInDown)
        const isFormMountedRecently = useMountedRecentlyFlag();

        const enteringAnimation = getEnteringAnimationForItemsUnderBuyCard(
            isFormMountedRecently,
            shouldAnimateEntering,
        );

        return (
            <AnimatedBox layout={LinearTransition}>
                <VStack spacing="sp16" testID={BUY_FORM_TEST_ID}>
                    <BuyAlert />
                    <BuyCard
                        isAmountInputActive={isAmountInputActive}
                        shouldAnimateEntering={shouldAnimateEntering}
                    />
                    {isAmountInputActive ? (
                        <BuyAmountEditingDoneButton />
                    ) : (
                        <>
                            <BuyPaymentCard
                                isFormMountedRecently={isFormMountedRecently}
                                shouldAnimateEntering={shouldAnimateEntering}
                            />
                            <BuyConfirmation enteringAnimation={enteringAnimation} />
                        </>
                    )}
                </VStack>
            </AnimatedBox>
        );
    },
);

export const BuyForm = ({ shouldAnimateEntering }: BuyFormProps) => {
    const dispatch = useDispatch();
    const buyForm = useBuyFormContext();
    useBuyQuotes(buyForm);

    const isAmountInputActive = !!buyForm.watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    useEffect(() => {
        dispatch(tradingActions.setIsAmountInputActive(isAmountInputActiveDebounced));
    }, [dispatch, isAmountInputActiveDebounced]);

    return (
        <BuyFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
