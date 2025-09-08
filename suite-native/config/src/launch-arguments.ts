import { LaunchArguments } from 'react-native-launch-arguments';

import { FeatureFlag } from '@suite-native/feature-flags';

type FeatureFlagLaunchArguments = {
    [key in FeatureFlag]?: boolean;
};

export type LaunchArguments = {
    detoxURLBlacklistRegex?: string;
    DTXDisableMainRunLoopSync?: boolean;
    isFirmwareUpdateEnabled?: boolean;
    preloadedState?: Record<string, unknown>;
    featureFlags?: FeatureFlagLaunchArguments;
};

export const launchArguments = LaunchArguments.value<LaunchArguments>();
