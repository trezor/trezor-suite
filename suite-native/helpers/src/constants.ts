import { isDetoxTestBuild } from '@suite-native/config';

export const ENDLESS_ANIMATION_VALUE = isDetoxTestBuild() ? 1 : -1;
