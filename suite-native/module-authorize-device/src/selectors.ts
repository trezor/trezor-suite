import { createWeakMapSelector } from '@suite-common/redux-utils';
import { ThpRootState, selectThpLastResult, selectThpStep } from '@suite-common/thp';
import { DeviceRootState, selectIsDeviceThpLocked } from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<ThpRootState & DeviceRootState>();

export const selectIsThpScreenDismissable = createMemoizedSelector(
    [selectThpStep, selectThpLastResult, selectIsDeviceThpLocked],
    (thpStep, thpLastResult, isDeviceThpLocked) =>
        thpStep === null && (thpLastResult === 'canceled' || !isDeviceThpLocked),
);
