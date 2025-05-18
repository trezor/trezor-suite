import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, InlineAlertBox } from '@suite-native/atoms';

import { useTradingBuyFormContext } from '../../hooks/buy/useBuyFormContext';

export const BuyAlert = () => {
    const { watch } = useTradingBuyFormContext();
    const text = watch('generalAlert');

    if (!text) return null;

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <InlineAlertBox title={text} variant="critical" />
        </AnimatedBox>
    );
};
