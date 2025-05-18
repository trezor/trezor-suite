import { memo } from 'react';
import { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { VStack } from '@suite-native/atoms';
import { useDebouncedValue } from '@trezor/react-utils';

import { BuyAlert } from './BuyAlert';
import { BuyAmountEditingDoneButton } from './BuyAmountEditingDoneButton';
import { BuyCard } from './BuyCard';
import { BuyConfirmation } from './BuyConfirmation';
import { BuyHeader } from './BuyHeader';
import { BuyPaymentCard } from './BuyPaymentCard';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyQuotes } from '../../hooks/buy/useBuyQuotes';
import { useMountedRecentlyFlag } from '../../hooks/general/useMountedRecentlyFlag';
import { Footer } from '../general/Footer';
import { HistoryButton } from '../general/HistoryButton';

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
            <VStack spacing="sp16" paddingTop="sp16" testID={BUY_FORM_TEST_ID}>
                {!isAmountInputActive && (
                    <BuyHeader isFormMountedRecently={isFormMountedRecently} />
                )}
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
                        <Footer enteringAnimation={enteringAnimation} />
                        <HistoryButton
                            tradeType="buy"
                            enteringAnimation={enteringAnimation}
                            exitingAnimation={FadeOutDown}
                        />
                    </>
                )}
            </VStack>
        );
    },
);

export const BuyForm = ({ shouldAnimateEntering }: BuyFormProps) => {
    const buyForm = useBuyFormContext();
    useBuyQuotes(buyForm);

    const isAmountInputActive = !!buyForm.watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    return (
        <BuyFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
