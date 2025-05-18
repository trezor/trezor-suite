import { Platform } from 'react-native';
import { FadeIn, FadeInDown, FadeOutUp, StretchInY, StretchOutY } from 'react-native-reanimated';

import { AnimatedBox, Card } from '@suite-native/atoms';

import { BuyCountryOfResidencePicker } from './BuyCountryOfResidencePicker';
import { BuyPaymentMethodPicker } from './BuyPaymentMethodPicker';
import { BuyProviderPicker } from './BuyProviderPicker';

export type PaymentCardProps = {
    isFormMountedRecently?: boolean;
    shouldAnimateEntering?: boolean;
};

const getEnteringAnimation = (isFormMountedRecently?: boolean, shouldAnimateEntering?: boolean) => {
    // on android fade animation looks ugly on view with shadows, better to skip the initial one
    // and use stretch animation instead for the rest of the time
    if (Platform.OS === 'android') {
        return isFormMountedRecently ? undefined : StretchInY;
    }

    if (isFormMountedRecently) {
        return shouldAnimateEntering ? FadeIn : undefined;
    }

    return FadeInDown;
};

// on android fade animation looks ugly on view with shadows, better to use stretch one here
const getExitingAnimation = () => (Platform.OS === 'android' ? StretchOutY : FadeOutUp);

export const BuyPaymentCard = ({
    isFormMountedRecently,
    shouldAnimateEntering,
}: PaymentCardProps) => {
    const enteringAnimation = getEnteringAnimation(isFormMountedRecently, shouldAnimateEntering);
    const exitingAnimation = getExitingAnimation();

    return (
        <AnimatedBox entering={enteringAnimation} exiting={exitingAnimation}>
            <Card noPadding>
                <BuyPaymentMethodPicker />
                <BuyCountryOfResidencePicker />
                <BuyProviderPicker />
            </Card>
        </AnimatedBox>
    );
};
