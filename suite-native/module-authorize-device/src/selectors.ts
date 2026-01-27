import { createWeakMapSelector } from '@suite-common/redux-utils';
import { ThpRootState, selectThpLastResult, selectThpStep } from '@suite-common/thp';
import { DeviceRootState, selectIsDeviceThpRequired } from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<ThpRootState & DeviceRootState>();

export const selectIsThpScreenDismissable = createMemoizedSelector(
    [selectThpStep, selectThpLastResult, selectIsDeviceThpRequired],
    (thpStep, thpLastResult, isDeviceThpRequired) =>
        thpStep === null && (thpLastResult === 'canceled' || !isDeviceThpRequired),
);
