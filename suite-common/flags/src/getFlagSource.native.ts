import { flagsMap } from './flagsMap';
import { type FlagType } from './types';

// Native: return the Metro-bundled asset module from the static require() map.
// Callers pass this straight to <Image source={...}> from expo-image / react-native.
export const getFlagSource = (country: FlagType) => flagsMap[country];
