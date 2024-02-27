import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

export const useIsAddCoinAccountEnabled = () => {
    const [isAddCoinAccountEnabled] = useFeatureFlag(FeatureFlag.IsAddCoinAccountEnabled);
    const [isDeviceConnectEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    return { isAddCoinAccountEnabled: isDeviceConnectEnabled && isAddCoinAccountEnabled };
};
