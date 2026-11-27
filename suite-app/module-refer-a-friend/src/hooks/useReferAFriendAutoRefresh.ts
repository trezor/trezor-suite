import { useEffect } from 'react';

import {
    REFER_A_FRIEND_REFRESH_INTERVAL_MS,
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
} from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseReferAFriendAutoRefreshParams = {
    isEnabled: boolean;
    deviceId: string | undefined;
};

/**
 * Keeps the open page up to date: refreshes when the window regains focus, and periodically
 * while it stays focused.
 */
export const useReferAFriendAutoRefresh = ({
    isEnabled,
    deviceId,
}: UseReferAFriendAutoRefreshParams) => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (!isEnabled) return;

        const refresh = () => {
            dispatch(fetchReferralProgramThunk({ isBackgroundRefresh: true }));

            if (deviceId !== undefined) {
                dispatch(fetchReferralAccountThunk({ deviceId, isBackgroundRefresh: true }));
            }
        };
        const refreshIfFocused = () => {
            if (document.hasFocus()) refresh();
        };

        const intervalId = setInterval(refreshIfFocused, REFER_A_FRIEND_REFRESH_INTERVAL_MS);
        window.addEventListener('focus', refresh);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', refresh);
        };
    }, [isEnabled, deviceId, dispatch]);
};
