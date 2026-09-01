import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';

import { BiometricOverlay } from './BiometricOverlay';
import {
    selectBiometricsError,
    selectIsBiometricsEnabled,
    selectShouldUserBeAuthenticated,
} from '../biometricsSelectors';
import { handleBiometricsAppStateChangeThunk } from '../biometricsThunks';

export const BiometricsModalRenderer = () => {
    const dispatch = useDispatch();

    const biometricsError = useSelector(selectBiometricsError);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);

    useEffect(() => {
        if (!isBiometricsOptionEnabled) {
            return;
        }

        const handleBiometricsAppStateChange = (nextAppState: AppStateStatus) => {
            dispatch(
                handleBiometricsAppStateChangeThunk({
                    nextAppState,
                }),
            );
        };

        handleBiometricsAppStateChange(AppState.currentState);

        const subscription = AppState.addEventListener('change', handleBiometricsAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [dispatch, isBiometricsOptionEnabled]);

    return shouldUserBeAuthenticated ? (
        <BiometricOverlay isBiometricsAuthButtonVisible={!!biometricsError} />
    ) : null;
};
