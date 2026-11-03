import { BottomTabView } from '@react-navigation/bottom-tabs';

import { NativeIOSTabView } from './NativeIOSTabView';
import { type AdaptiveBottomTabViewProps } from './types';

export const AdaptiveBottomTabView = ({
    isNativeNavigationEnabled = false,
    tabItemOptions,
    ...props
}: AdaptiveBottomTabViewProps) =>
    isNativeNavigationEnabled ? (
        <NativeIOSTabView {...props} tabItemOptions={tabItemOptions} />
    ) : (
        <BottomTabView {...props} />
    );
