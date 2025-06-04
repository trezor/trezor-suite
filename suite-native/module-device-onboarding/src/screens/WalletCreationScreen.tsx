import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { createAndBackupWalletThunk } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { ERRORS } from '@trezor/connect';

import { WalletCreationAccordionHint } from '../components/WalletCreationAccordionHint';
import { WalletCreationBackupWarningCard } from '../components/WalletCreationBackupWarningCard';
import { WalletInitScreenWrapper } from '../components/WalletInitScreenWrapper';

// Do not retry if user cancelled the flow via the app UI, or the Entropy check has failed
const DEFINITIVE_ERRORS: ERRORS.ErrorCode[] = [
    'Method_Interrupted',
    'Failure_ActionCancelled',
    'Failure_EntropyCheck',
];

export const WalletCreationScreen = ({
    navigation,
    route,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.WalletCreation>) => {
    const { walletBackupType } = route.params;
    const dispatch = useDispatch();

    const handleCreateAndBackupWallet = useCallback(async () => {
        const response = await dispatch(createAndBackupWalletThunk({ walletBackupType })).unwrap();

        if (response.success) {
            return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess, {
                flowType: 'create',
            });
        }
        if (response.payload.code && DEFINITIVE_ERRORS.includes(response.payload.code)) return;

        handleCreateAndBackupWallet();
    }, [dispatch, walletBackupType, navigation]);

    useEffect(() => {
        handleCreateAndBackupWallet();
    }, [handleCreateAndBackupWallet]);

    return (
        <WalletInitScreenWrapper>
            <WalletCreationAccordionHint />
            <WalletCreationBackupWarningCard />
        </WalletInitScreenWrapper>
    );
};
