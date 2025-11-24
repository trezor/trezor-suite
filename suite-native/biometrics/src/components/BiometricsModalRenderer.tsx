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
            dispatch(
                handleBiometricsAppStateChangeThunk({
                    currentAppState: nextAppState,
                }),
            );
        },
        [dispatch],
    );

    useEffect(() => {
        if (!isBiometricsOptionEnabled) {
            return;
        }

        // Authentication on mount
        handleBiometricsAppStateChange(AppState.currentState);

        const subscription = AppState.addEventListener('change', handleBiometricsAppStateChange);

        // const blurSubscription = AppState.addEventListener('blur', () => {
        //     // On Android, blur is equivalent of inactive state on iOS
        //     if (isBiometricsOptionEnabled) {
        //         console.log('BiometricsModalRenderer: AppState blur event detected');
        //     }
        // });
        // const focusSubscription = AppState.addEventListener('focus', () => {
        //     // On Android, focus is equivalent of going from inactive state on iOS
        //     if (isBiometricsOptionEnabled) {
        //         console.log('BiometricsModalRenderer: AppState focus event detected');
        //     }
        // });

        return () => {
            // blurSubscription.remove();
            // focusSubscription.remove();
            subscription.remove();
        };
    }, [dispatch, handleBiometricsAppStateChange, isBiometricsOptionEnabled]);

    return shouldUserBeAuthenticated ? (
        <BiometricOverlay isBiometricsAuthButtonVisible={!!biometricsError} />
    ) : null;
};
