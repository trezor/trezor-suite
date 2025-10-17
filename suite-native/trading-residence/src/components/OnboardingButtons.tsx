import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { ConfirmLocationButton } from './ConfirmLocationButton';
import { SkipButton } from './SkipButton';
import { tradingResidenceActions } from '../reducers/residenceSlice';

export const OnboardingButtons = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const setOnboardingVisitedAndNavigate = () => {
        dispatch(tradingResidenceActions.setOnboardingVisited());

        // todo 22469 navigate to dashboard
        navigation.goBack();
    };

    return (
        <>
            <ConfirmLocationButton afterConfirm={setOnboardingVisitedAndNavigate} />
            <SkipButton onPress={setOnboardingVisitedAndNavigate} />
        </>
    );
};
