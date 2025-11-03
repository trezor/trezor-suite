import { useDispatch } from 'react-redux';

import { tradingResidenceActions } from '@suite-native/trading-state';

import { ConfirmLocationButton } from './ConfirmLocationButton';
import { SkipButton } from './SkipButton';

export type OnboardingButtonsProps = {
    afterPress: () => void;
};

export const OnboardingButtons = ({ afterPress }: OnboardingButtonsProps) => {
    const dispatch = useDispatch();

    const handleOnboardingComplete = () => {
        dispatch(tradingResidenceActions.setOnboardingVisited());
        afterPress();
    };

    return (
        <>
            <ConfirmLocationButton afterConfirm={handleOnboardingComplete} />
            <SkipButton onPress={handleOnboardingComplete} />
        </>
    );
};
