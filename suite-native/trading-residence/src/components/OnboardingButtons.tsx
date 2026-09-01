import { useDispatch } from '@suite-common/redux-utils';
import { residenceActions } from '@suite-native/trading-state';

import { ConfirmLocationButton } from './ConfirmLocationButton';
import { SkipButton } from './SkipButton';

export type OnboardingButtonsProps = {
    afterPress: () => void;
};

export const OnboardingButtons = ({ afterPress }: OnboardingButtonsProps) => {
    const dispatch = useDispatch();

    const handleOnboardingComplete = () => {
        dispatch(residenceActions.setOnboardingVisited());
        afterPress();
    };

    return (
        <>
            <ConfirmLocationButton
                afterConfirm={handleOnboardingComplete}
                testId="@onboarding/confirmLocation"
            />
            <SkipButton onPress={handleOnboardingComplete} testId="@onboarding/skipLocation" />
        </>
    );
};
