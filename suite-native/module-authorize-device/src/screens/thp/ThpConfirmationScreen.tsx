import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpStep } from '@suite-common/thp';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAutoconnectAlerts } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showThpAutoconnectEnableAlert } = useThpAutoconnectAlerts();

    const thpStep = useSelector(selectThpStep);

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
