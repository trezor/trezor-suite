import { useDispatch } from 'react-redux';

import { ConfirmLocationButton } from './ConfirmLocationButton';
import { SkipButton } from './SkipButton';
import { tradingResidenceActions } from '../reducers/residenceSlice';

export type OnboardingButtonsProps = {
    afterPress: () => void;
};

export const OnboardingButtons = ({ afterPress }: OnboardingButtonsProps) => {
    const dispatch = useDispatch();

    const setOnboardingVisitedAndNavigate = () => {
        dispatch(tradingResidenceActions.setOnboardingVisited());
        afterPress();
    };

    return (
        <>
            <ConfirmLocationButton afterConfirm={setOnboardingVisitedAndNavigate} />
            <SkipButton onPress={setOnboardingVisitedAndNavigate} />
        </>
    );
};
