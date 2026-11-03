import { Platform } from 'react-native';

const LIQUID_GLASS_MIN_IOS_MAJOR_VERSION = 26;

export const isLiquidGlassAvailable =
    Platform.OS === 'ios' &&
    Number.parseInt(String(Platform.Version), 10) >= LIQUID_GLASS_MIN_IOS_MAJOR_VERSION;
