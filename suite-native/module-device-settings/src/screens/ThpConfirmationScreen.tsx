import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceThpLocked } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { Box } from '@suite-native/atoms';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { nativeFirmwareActions } from '@suite-native/firmware';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    StackNavigationProps,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.ThpConfirmation
>;

export const ThpConfirmationScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const thpStep = useSelector(selectThpStep);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);

    useInterceptNativeNavigation();

    useEffect(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.goBack();
        } else if (!isDeviceThpLocked) {
            dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
            navigateToInitialScreen();
        }
    }, [thpStep, isDeviceThpLocked, navigation, dispatch, navigateToInitialScreen]);

    return (
        <Screen isScrollable={false} noBottomPadding={true} hasBottomInset={false}>
            <Box marginTop="sp64" flex={1}>
                <ContinueOnTrezorScreenContent />
            </Box>
        </Screen>
    );
};
