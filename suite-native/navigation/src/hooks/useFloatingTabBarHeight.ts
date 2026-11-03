import { useContext } from 'react';

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

/**
 * Height of the floating tab bar overlapping the bottom of the current screen, or 0 outside of the
 * tab navigator. Scrollable content should be padded by this value so it can scroll above the bar.
 */
export const useFloatingTabBarHeight = () => useContext(BottomTabBarHeightContext) ?? 0;
