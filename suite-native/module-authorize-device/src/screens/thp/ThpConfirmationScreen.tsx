import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAutoconnectAlert } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { selectIsThpScreenDismissable } from '../../selectors';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    const { showEnableThpAutoconnectAlert } = useThpAutoconnectAlert();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);
    const isThpScreenDismissable = useSelector(selectIsThpScreenDismissable);

    useInterceptNativeNavigation();

    useFocusEffect(
        useCallback(() => {
            if (thpStep === 'CodeEntry') {
                navigation.replace(AuthorizeDeviceStackRoutes.ThpCodeEntry);
            } else if (thpAutoconnectStep === 'AutoconnectInfo') {
                showEnableThpAutoconnectAlert();
            } else if (isThpScreenDismissable) {
                navigateToInitialScreen();
            }
        }, [
            thpStep,
            thpAutoconnectStep,
            isThpScreenDismissable,
            showEnableThpAutoconnectAlert,
            navigateToInitialScreen,
            navigation,
        ]),
    );

    return (
        <Screen
            header={<ThpScreenHeader />}
            isScrollable={false}
            noBottomPadding={true}
            hasBottomInset={false}
        >
            <ContinueOnTrezorScreenContent />
        </Screen>
    );
};
