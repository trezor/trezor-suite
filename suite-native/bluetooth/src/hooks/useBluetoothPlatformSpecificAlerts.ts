/**
 * Platform-specific Bluetooth alerts hook
 *
 * This file serves as the main entry point for the platform-specific Bluetooth alerts hook.
 * React Native's Metro bundler will automatically resolve to the appropriate platform-specific
 * implementation (.ios.tsx for iOS, .android.tsx for Android) based on the platform.
 */

import { useBluetoothPlatformSpecificAlerts as iosImpl } from './useBluetoothPlatformSpecificAlerts.ios';

// Re-export the iOS implementation as the default
// Metro bundler will handle platform-specific resolution at build time
export const useBluetoothPlatformSpecificAlerts = iosImpl;
