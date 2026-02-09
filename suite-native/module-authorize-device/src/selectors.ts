import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    ThpRootState,
    selectThpAutoconnectStep,
    selectThpLastResult,
    selectThpStep,
} from '@suite-common/thp';
import { DeviceRootState, selectIsDeviceThpLocked } from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<ThpRootState & DeviceRootState>();

export const selectIsThpScreenDismissable = createMemoizedSelector(
    [selectThpStep, selectThpAutoconnectStep, selectThpLastResult, selectIsDeviceThpLocked],
    (thpStep, thpAutoconnectStep, thpLastResult, isDeviceThpLocked) =>
        thpStep === null &&
        thpAutoconnectStep === null &&
        (thpLastResult === 'canceled' || !isDeviceThpLocked),
);
