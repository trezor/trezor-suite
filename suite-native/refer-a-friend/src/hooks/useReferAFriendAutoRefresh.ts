import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectDeviceId } from '@suite-common/device';
import {
    REFER_A_FRIEND_REFRESH_INTERVAL_MS,
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
} from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseReferAFriendAutoRefreshParams = {
    isEnabled: boolean;
};

/**
 * Keeps the open screen up to date: refreshes when the screen or the app returns to the
 * foreground, and periodically while the screen is focused and the app is active.
 */
export const useReferAFriendAutoRefresh = ({ isEnabled }: UseReferAFriendAutoRefreshParams) => {
    const { dispatch } = useServices(injectDispatch);
    const deviceId = useSelector(selectDeviceId);
    // The initial load is done by useReferAFriend, only returning to the screen refreshes.
    const isFirstFocusRef = useRef(true);

    useFocusEffect(
        useCallback(() => {
            if (!isEnabled || !deviceId) return;

            const refresh = () => {
                dispatch(fetchReferralProgramThunk({ isBackgroundRefresh: true }));
                dispatch(fetchReferralAccountThunk({ deviceId, isBackgroundRefresh: true }));
            };

            if (isFirstFocusRef.current) {
                isFirstFocusRef.current = false;
            } else {
                refresh();
            }

            const intervalId = setInterval(() => {
                if (AppState.currentState === 'active') refresh();
            }, REFER_A_FRIEND_REFRESH_INTERVAL_MS);
            const appStateSubscription = AppState.addEventListener('change', nextAppState => {
                if (nextAppState === 'active') refresh();
            });

            return () => {
                clearInterval(intervalId);
                appStateSubscription.remove();
            };
        }, [isEnabled, deviceId, dispatch]),
    );
};
