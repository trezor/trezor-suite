import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { useAlert } from '@suite-native/alerts';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAutoconnectActions } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';
import { selectIsThpScreenDismissable } from '../../selectors';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    useInterceptNativeNavigation();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { startThpAutoconnect, ignoreThpAutoconnect } = useThpAutoconnectActions();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);
    const isThpScreenDismissable = useSelector(selectIsThpScreenDismissable);

    const { showAlert } = useAlert();

    const showThpAutoconnectEnableAlert = useCallback(() => {
        showAlert({
            title: <Translation id="thp.autoconnect.title" />,
            description: <Translation id="thp.autoconnect.description" />,
            primaryButtonTitle: <Translation id="thp.autoconnect.turnOnButton" />,
            onPressPrimaryButton: startThpAutoconnect,
            secondaryButtonTitle: <Translation id="thp.autoconnect.noThanksButton" />,
            onPressSecondaryButton: ignoreThpAutoconnect,
        });
    }, [showAlert, startThpAutoconnect, ignoreThpAutoconnect]);

    useFocusEffect(
        useCallback(() => {
            if (thpStep === 'CodeEntry') {
                navigation.replace(AuthorizeDeviceStackRoutes.ThpCodeEntry);
            } else if (thpAutoconnectStep === 'AutoconnectInfo') {
                showThpAutoconnectEnableAlert();
            } else if (isThpScreenDismissable) {
                navigateToInitialScreen();
            }
        }, [
            thpStep,
            thpAutoconnectStep,
            isThpScreenDismissable,
            navigateToInitialScreen,
            navigation,
            showThpAutoconnectEnableAlert,
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
