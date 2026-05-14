import { memo, useEffect } from 'react';
import { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, VStack } from '@suite-native/atoms';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { AmountEditingDoneButton } from '@suite-native/trading-atoms';

import { SellAlert } from './SellAlert';
import { SellCard } from './SellCard';
import { SellConfirmation } from './SellConfirmation';
import { SellPaymentCard } from './payment/SellPaymentCard';
import { useFocusedValueWatch } from '../../hooks/general/useFocusedValueWatch';
import { useMountedRecentlyFlag } from '../../hooks/general/useMountedRecentlyFlag';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { useSellQuotes } from '../../hooks/sell/useSellQuotes';
import { ConciergeAlert } from '../concierge/ConciergeAlert';
import { BuySellKYCWarning } from '../general/BuySellKYCWarning';

type SellFormProps = {
    shouldAnimateEntering?: boolean;
};

type SellFormMemoizedProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const SELL_FORM_TEST_ID = '@trading/sell/form';
const AMOUNT_EDITING_DONE_BUTTON_TEST_ID = '@trading/sell/amount-editing-done-button';

const getEnteringAnimationForItemsUnderSellCard = (
    isFormMountedRecently?: boolean,
    shouldAnimateEntering?: boolean,
) => {
    if (!isFormMountedRecently) {
        return FadeInDown;
    }

    return shouldAnimateEntering ? FadeIn : undefined;
};

const SellFormMemoized = memo(
    ({ isAmountInputActive, shouldAnimateEntering }: SellFormMemoizedProps) => {
        // `isFormMountedRecently` allows to use different animations for initial form load (FadeIn)
        // and when user interacts with the form (FadeInUp/FadeInDown)
        const isFormMountedRecently = useMountedRecentlyFlag();

        const enteringAnimation = getEnteringAnimationForItemsUnderSellCard(
            isFormMountedRecently,
            shouldAnimateEntering,
        );

        return (
            <AnimatedBox layout={LinearTransition}>
                <VStack spacing="sp16" testID={SELL_FORM_TEST_ID}>
                    <SellAlert />
                    <SellCard
                        isAmountInputActive={isAmountInputActive}
                        shouldAnimateEntering={shouldAnimateEntering}
                    />
                    {isAmountInputActive ? (
                        <AmountEditingDoneButton testID={AMOUNT_EDITING_DONE_BUTTON_TEST_ID} />
                    ) : (
                        <>
                            <SellPaymentCard
                                shouldAnimateEntering={shouldAnimateEntering}
                                isFormMountedRecently={isFormMountedRecently}
                            />
                            <BuySellKYCWarning type="sell" />
                            <SellConfirmation enteringAnimation={enteringAnimation} />
                            <ConciergeAlert tradingType="sell" />
                        </>
                    )}
                </VStack>
            </AnimatedBox>
        );
    },
);

export const SellForm = ({ shouldAnimateEntering }: SellFormProps) => {
    const sellForm = useSellFormContext();
    const isAmountInputActiveDebounced = useFocusedValueWatch(sellForm.watch);
    const reportToAnalytics = useSellAnalyticReportCallback();

    useSellQuotes(sellForm);

    useEffect(() => {
        reportToAnalytics('sell-form', 'visit');
    }, [reportToAnalytics]);

    return (
        <SellFormMemoized
            isAmountInputActive={isAmountInputActiveDebounced}
            shouldAnimateEntering={shouldAnimateEntering}
        />
    );
};
