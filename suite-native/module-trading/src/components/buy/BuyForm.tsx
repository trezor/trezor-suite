import { memo } from 'react';
import { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, VStack } from '@suite-native/atoms';
import { AmountEditingDoneButton } from '@suite-native/trading-atoms';

import { BuyAlert } from './BuyAlert';
import { BuyCard } from './BuyCard';
import { BuyConfirmation } from './BuyConfirmation';
import { BuyPaymentCard } from './BuyPaymentCard';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyQuotes } from '../../hooks/buy/useBuyQuotes';
import { useFocusedValueWatch } from '../../hooks/general/useFocusedValueWatch';
import { useMountedRecentlyFlag } from '../../hooks/general/useMountedRecentlyFlag';
import { ConciergeAlert } from '../concierge/ConciergeAlert';
import { BuySellKYCWarning } from '../general/BuySellKYCWarning';
import { LastErrorMessage } from '../general/Error/LastErrorMessage';

type BuyFormProps = {
    shouldAnimateEntering?: boolean;
};

type BuyFormMemoizedProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const BUY_FORM_TEST_ID = '@trading/buy/form';
const AMOUNT_EDITING_DONE_BUTTON_TEST_ID = '@trading/buy/amount-editing-done-button';

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
                <VStack spacing="sp16" testID={BUY_FORM_TEST_ID} accessible>
                    <LastErrorMessage tradingType="buy" />
                    <BuyAlert />
                    <BuyCard
                        isAmountInputActive={isAmountInputActive}
                        shouldAnimateEntering={shouldAnimateEntering}
                    />
                    {isAmountInputActive ? (
                        <AmountEditingDoneButton testID={AMOUNT_EDITING_DONE_BUTTON_TEST_ID} />
                    ) : (
                        <>
                            <BuyPaymentCard
                                isFormMountedRecently={isFormMountedRecently}
                                shouldAnimateEntering={shouldAnimateEntering}
                            />
                            <BuySellKYCWarning type="buy" />
                            <BuyConfirmation enteringAnimation={enteringAnimation} />
                            <ConciergeAlert tradingType="buy" />
                        </>
                    )}
                </VStack>
            </AnimatedBox>
        );
    },
);

export const BuyForm = ({ shouldAnimateEntering }: BuyFormProps) => {
    const buyForm = useBuyFormContext();
    const isAmountInputActiveDebounced = useFocusedValueWatch(buyForm.watch);
    useBuyQuotes(buyForm);

    return (
        <BuyFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
