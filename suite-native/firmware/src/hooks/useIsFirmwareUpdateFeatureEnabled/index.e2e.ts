import { launchArguments } from '@suite-native/config';

import { useIsFirmwareUpdateFeatureEnabled as useOriginalFirmwareUpdateFeatureEnabled } from './useIsFirmwareUpdateFeatureEnabled';

export const useIsFirmwareUpdateFeatureEnabled = () => {
    const isFirmwareUpdateEnabled = useOriginalFirmwareUpdateFeatureEnabled();

    return launchArguments.isFirmwareUpdateEnabled ?? isFirmwareUpdateEnabled;
};
