import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { selectThpStep } from '@suite-common/thp';
import { selectIsDeviceThpRequired } from '@suite-common/wallet-core';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAlerts } from '@suite-native/thp';

import { ThpScreenHeader } from '../../components/thp/ThpScreenHeader';

export const ThpConfirmationScreen = ({
    navigation,
}: {
    navigation: NativeStackNavigationProp<AuthorizeDeviceStackParamList>;
}) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showThpAutoconnectAlert } = useThpAlerts();

    const isDeviceThpRequired = useSelector(selectIsDeviceThpRequired);
    const thpStep = useSelector(selectThpStep);

    useEffect(() => {
        if (isDeviceThpRequired && thpStep === null) {
            navigateToInitialScreen();
        } else if (thpStep === 'CodeEntry') {
            navigation.navigate(AuthorizeDeviceStackRoutes.ThpCodeEntry);
        } else if (thpStep === 'AutoconnectInfo') {
            showThpAutoconnectAlert();
        }
    }, [
        isDeviceThpRequired,
        thpStep,
        navigateToInitialScreen,
        navigation,
        showThpAutoconnectAlert,
    ]);

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
