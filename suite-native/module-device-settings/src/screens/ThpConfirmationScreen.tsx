import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectThpStep } from '@suite-common/thp';
import { Box } from '@suite-native/atoms';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { nativeFirmwareActions } from '@suite-native/firmware';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    StackNavigationProps,
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

    useEffect(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.goBack();
        } else if (thpStep === null) {
            dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
            navigateToInitialScreen();
        }
    }, [thpStep, navigation, dispatch, navigateToInitialScreen]);

    return (
        <Screen>
            <Box marginTop="sp64">
                <ContinueOnTrezorScreenContent />
            </Box>
        </Screen>
    );
};
