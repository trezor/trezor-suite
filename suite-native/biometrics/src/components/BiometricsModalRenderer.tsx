import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { BiometricOverlay } from './BiometricOverlay';
import {
    selectBiometricsError,
    selectIsBiometricsEnabled,
    selectShouldUserBeAuthenticated,
} from '../biometricsSlice';
import { handleBiometricsAppStateChangeThunk } from '../biometricsThunks';

export const BiometricsModalRenderer = () => {
    const dispatch = useDispatch();

    const biometricsError = useSelector(selectBiometricsError);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);

    const handleBiometricsAppStateChange = useCallback(
        (nextAppState: AppStateStatus) => {
            if (!isBiometricsOptionEnabled) {
                return;
            }

            dispatch(
                handleBiometricsAppStateChangeThunk({
                    currentAppState: nextAppState,
                }),
            );
        },
        [dispatch, isBiometricsOptionEnabled],
    );

    useEffect(() => {
        // Authentication on mount
        handleBiometricsAppStateChange(AppState.currentState);

        const subscription = AppState.addEventListener('change', handleBiometricsAppStateChange);

        return () => subscription.remove();
    }, [dispatch, handleBiometricsAppStateChange]);

    return shouldUserBeAuthenticated ? (
        <BiometricOverlay isBiometricsAuthButtonVisible={!!biometricsError} />
    ) : null;
};
