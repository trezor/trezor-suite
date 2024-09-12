import { isDetoxTestBuild } from '@suite-native/config';

// Ensures that the animation is not infinitely looped in the Detox tests to avoid synchronization problems.
export const ENDLESS_ANIMATION_VALUE = isDetoxTestBuild() ? 1 : -1;
