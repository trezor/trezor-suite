import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpStep } from '@suite-common/thp';
import { useAlert } from '@suite-native/alerts';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAutoconnectActions } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { startThpAutoconnect, ignoreThpAutoconnect } = useThpAutoconnectActions();

    const thpStep = useSelector(selectThpStep);

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

    useEffect(() => {
        if (thpStep === 'CodeEntry') {
            navigation.navigate(AuthorizeDeviceStackRoutes.ThpCodeEntry);
        } else if (thpStep === 'AutoconnectInfo') {
            showThpAutoconnectEnableAlert();
        } else if (thpStep === null) {
            navigateToInitialScreen();
        }
    }, [thpStep, navigateToInitialScreen, navigation, showThpAutoconnectEnableAlert]);

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
