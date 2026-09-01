import { useCallback } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

import { BiometricsToggleResult, toggleBiometricsSettingsThunk } from './biometricsThunks';

export const useBiometricsSettings = () => {
    const { showAlert } = useAlert();

    const dispatch = useDispatch();

    const toggleBiometricsOption = useCallback(async () => {
        const authResult = await dispatch(toggleBiometricsSettingsThunk());

        if (authResult.payload === BiometricsToggleResult.BiometricsNotAvailable) {
            await new Promise(resolve => {
                showAlert({
                    title: <Translation id="biometrics.biometricsUnavailableAlert.title" />,
                    description: (
                        <Translation id="biometrics.biometricsUnavailableAlert.description" />
                    ),
                    primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressPrimaryButton: () => resolve(undefined),
                    pictogramVariant: 'warning',
                });
            });
        }

        return authResult.payload;
    }, [dispatch, showAlert]);

    return { toggleBiometricsOption };
};
