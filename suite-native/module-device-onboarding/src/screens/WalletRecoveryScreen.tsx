import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { recoverWalletThunk } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { WalletInitScreenWrapper } from '../components/WalletInitScreenWrapper';
import { WalletRecoveryAccordionHint } from '../components/WalletRecoveryAccordionHint';

export const WalletRecoveryScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.WalletRecovery>) => {
    const dispatch = useDispatch();

    const handleRecoverWallet = useCallback(async () => {
        const response = await dispatch(recoverWalletThunk()).unwrap();

        if (response.success) {
            return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess, {
                flowType: 'recover',
            });
        }
        // Do not retry if user cancelled the flow via the app UI
        if (response.payload.code && response.payload.code === 'Method_Interrupted') return;

        handleRecoverWallet();
    }, [dispatch, navigation]);

    useEffect(() => {
        handleRecoverWallet();
    }, [handleRecoverWallet]);

    return (
        <WalletInitScreenWrapper>
            <WalletRecoveryAccordionHint />
        </WalletInitScreenWrapper>
    );
};
