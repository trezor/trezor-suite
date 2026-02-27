import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { getIsIgnoredEntropyCheckError } from '@suite-common/device';
import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { ContinueOnTrezorScreenContent, createAndBackupWalletThunk } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

// Do not retry if user cancelled the flow via the app UI, or the Entropy check has failed
const DEFINITIVE_ERRORS: ERRORS.ErrorCode[] = [
    'Method_Interrupted',
    'Failure_ActionCancelled',
    'Failure_EntropyCheck',
];

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletCreation,
    RootStackParamList
>;

type RouteProps = RouteProp<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletCreation
>;

export const WalletCreationScreen = () => {
    const route = useRoute<RouteProps>();
    const { walletBackupType } = route.params;
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showToast } = useToast();

    const isEntropyCheckEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.entropyCheckMobile, true),
    );

    const handleCreateAndBackupWallet = useCallback(async () => {
        const response = await dispatch(createAndBackupWalletThunk({ walletBackupType }));

        if (isFulfilled(response)) {
            const responsePayload = response.payload;

            if (responsePayload.success) {
                return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess, {
                    flowType: 'create',
                });
            }
            const { code, message } = responsePayload.error;
            const isDefinitiveError = code && DEFINITIVE_ERRORS.includes(code);
            // inconclusive, so repeat the attempt
            if (!isDefinitiveError || getIsIgnoredEntropyCheckError(message)) {
                showToast({ variant: 'error', message });
                // This code is OK, but the eslint plugin crashes on recursive calls
                // eslint-disable-next-line react-hooks/immutability
                handleCreateAndBackupWallet();

                return;
            }

            // handle entropy check failure
            if (isEntropyCheckEnabled && code === 'Failure_EntropyCheck') {
                return navigation.navigate(RootStackRoutes.DeviceCompromisedModal);
            }
            // canceled on device -> cancel in suite
            else if (code === 'Failure_ActionCancelled' || code === 'Method_Interrupted') {
                return navigateToInitialScreen();
            }

            console.error(`Unknown definitive code: '${code}'`);
        }
    }, [
        dispatch,
        walletBackupType,
        navigation,
        navigateToInitialScreen,
        isEntropyCheckEnabled,
        showToast,
    ]);

    useEffect(() => {
        handleCreateAndBackupWallet();
    }, [handleCreateAndBackupWallet]);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
