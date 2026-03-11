import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { ContinueOnTrezorScreenContent, recoverWalletThunk } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const WalletRecoveryScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.WalletRecovery>) => {
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleRecoverWallet = useCallback(async () => {
        const response = await dispatch(recoverWalletThunk()).unwrap();

        if (response.success) {
            return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess, {
                flowType: 'recover',
            });
        }
        // Do not retry if user cancelled the flow via the app UI
        if (
            response.error.code === 'Failure_ActionCancelled' ||
            response.error.code === 'Method_Interrupted'
        ) {
            return navigateToInitialScreen();
        }

        // This code is OK, but the eslint plugin crashes on recursive calls
        // eslint-disable-next-line react-hooks/immutability
        handleRecoverWallet();
    }, [dispatch, navigation, navigateToInitialScreen]);

    useEffect(() => {
        handleRecoverWallet();
    }, [handleRecoverWallet]);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
