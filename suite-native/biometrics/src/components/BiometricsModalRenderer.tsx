import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';

import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BiometricOverlay } from './BiometricOverlay';
import {
    selectBiometricsError,
    selectIsBiometricsEnabled,
    selectShouldUserBeAuthenticated,
} from '../biometricsSelectors';
import { handleBiometricsAppStateChangeThunk } from '../biometricsThunks';

const APP_STATE_STATUSES: AppStateStatus[] = [
    'active',
    'background',
    'inactive',
    'unknown',
    'extension',
];

const isAppStateStatus = (appState: string | null | undefined): appState is AppStateStatus =>
    APP_STATE_STATUSES.some(status => status === appState);

export const BiometricsModalRenderer = () => {
    const { dispatch } = useServices(injectDispatch);

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

        const { currentState } = AppState;
        if (isAppStateStatus(currentState)) {
            handleBiometricsAppStateChange(currentState);
        }

        const subscription = AppState.addEventListener('change', handleBiometricsAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [dispatch, isBiometricsOptionEnabled]);

    return shouldUserBeAuthenticated ? (
        <BiometricOverlay isBiometricsAuthButtonVisible={!!biometricsError} />
    ) : null;
};
