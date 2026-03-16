import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { Box } from '@suite-native/atoms';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { nativeFirmwareActions } from '@suite-native/firmware';
import {
    type FirmwareUpdateStackParamList,
    type FirmwareUpdateStackRoutes,
    Screen,
    type StackNavigationProps,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useThpAutoconnectAlert } from '@suite-native/thp';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.ThpConfirmation
>;

export const ThpConfirmationScreen = () => {
    const { showEnableThpAutoconnectAlert } = useThpAutoconnectAlert();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    useInterceptNativeNavigation();

    useFocusEffect(
        useCallback(() => {
            if (thpStep === 'BeforeConnectionInfo') {
                navigation.goBack();
            } else if (thpAutoconnectStep === 'AutoconnectInfo') {
                showEnableThpAutoconnectAlert();
            } else if (thpAutoconnectStep === null && !isDeviceThpLocked) {
                dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
                navigateToInitialScreen();
            }
        }, [
            thpStep,
            thpAutoconnectStep,
            isDeviceThpLocked,
            navigation,
            dispatch,
            showEnableThpAutoconnectAlert,
            navigateToInitialScreen,
        ]),
    );

    return (
        <Screen isScrollable={false} noBottomPadding={true} hasBottomInset={false}>
            <Box marginTop="sp64" flex={1}>
                <ContinueOnTrezorScreenContent />
            </Box>
        </Screen>
    );
};
