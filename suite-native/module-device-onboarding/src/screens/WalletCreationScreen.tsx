import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

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
        const response = await dispatch(createAndBackupWalletThunk({ walletBackupType }));

        if (isFulfilled(response)) {
            const responsePayload = response.payload;

            if (responsePayload.success) {
                return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess, {
                    flowType: 'create',
                });
            }
            if (
                responsePayload.payload.code &&
                DEFINITIVE_ERRORS.includes(responsePayload.payload.code)
            ) {
                return;
            }
        }

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
