import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

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
} from '@suite-native/navigation';
import { ERRORS } from '@trezor/connect';

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
            const { code } = responsePayload.payload;
            if (code && DEFINITIVE_ERRORS.includes(code)) {
                if (isEntropyCheckEnabled && code === 'Failure_EntropyCheck') {
                    navigation.navigate(RootStackRoutes.DeviceCompromisedModal);
                }

                return;
            }
        }
        // repeat the attempt if error was not one of the DEFINITIVE_ERRORS
        // This code is OK, but the eslint plugin crashes on recursive calls
        // eslint-disable-next-line react-hooks/immutability
        handleCreateAndBackupWallet();
    }, [dispatch, walletBackupType, navigation, isEntropyCheckEnabled]);

    useEffect(() => {
        handleCreateAndBackupWallet();
    }, [handleCreateAndBackupWallet]);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
