import { useDispatch } from 'react-redux';

import { ConfirmLocationButton } from './ConfirmLocationButton';
import { SkipButton } from './SkipButton';
import { tradingResidenceActions } from '../reducers/residenceSlice';

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
