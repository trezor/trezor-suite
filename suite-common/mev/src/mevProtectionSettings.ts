import { type DeviceRootState, selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState & MessageSystemRootState
>();

export type MevProtectionRootState = MessageSystemRootState;

export const selectIsMevProtectionFeatureEnabled = (state: MevProtectionRootState) =>
    selectIsFeatureEnabled(state, Feature.mevProtection, true);

export const selectIsMevProtectionSettingsVisible = createMemoizedSelector(
    [selectIsMevProtectionFeatureEnabled, selectHasBitcoinOnlyFirmware],
    (isFeatureEnabled, hasBitcoinOnlyFirmware) => isFeatureEnabled && !hasBitcoinOnlyFirmware,
);
