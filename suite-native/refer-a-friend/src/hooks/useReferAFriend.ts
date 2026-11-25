import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceId, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { fetchReferralAccountThunk, fetchReferralProgramThunk } from '@suite-common/refer-a-friend';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useReferAFriend = () => {
    const { dispatch } = useServices(injectDispatch);

    const isReferAFriendFeatureEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.referAFriend, isDevelopOrDebugEnv()),
    );
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const deviceId = useSelector(selectDeviceId);

    const isReferAFriendFeatureAvailable =
        isReferAFriendFeatureEnabled && !isPortfolioTrackerDevice;

    useEffect(() => {
        if (isReferAFriendFeatureAvailable && deviceId) {
            dispatch(fetchReferralProgramThunk());
            dispatch(fetchReferralAccountThunk({ deviceId }));
        }
    }, [isReferAFriendFeatureAvailable, deviceId, dispatch]);

    return {
        isReferAFriendFeatureAvailable,
    };
};
