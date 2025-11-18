import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { isRejected } from '@reduxjs/toolkit';

import { useAlert } from '@suite-native/alerts';

import { AuthenticateError, toggleBiometricsSettingsThunk } from './biometricsThunks';

export type BiometricsToggleResult = 'enabled' | 'disabled' | 'failed' | 'notAvailable';

export const useBiometricsSettings = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();

    const toggleBiometricsOption = useCallback(async (): Promise<BiometricsToggleResult> => {
        const authResult = await dispatch(toggleBiometricsSettingsThunk());

        if (isRejected(authResult)) {
            if (authResult.payload === AuthenticateError.BiometricsNotAvailable) {
                await new Promise(resolve => {
                    showAlert({
                        title: 'Biometrics',
                        description:
                            'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
                        primaryButtonTitle: 'Cancel',
                        onPressPrimaryButton: () => resolve(undefined),
                        pictogramVariant: 'warning',
                    });
                });

                return 'notAvailable';
            }

            return 'failed';
        }

        return authResult.payload;
    }, [dispatch, showAlert]);

    return { toggleBiometricsOption };
};
