import { type NativeSegmentedControlProps } from './segmentedControlTypes';

// Expo UI's iOS Picker keeps a rejected selection in local state. Keep the controlled fallback.
export const supportsNativeSegmentedControl = false;

export const NativeSegmentedControl = <TValue extends string>(
    _props: NativeSegmentedControlProps<TValue>,
) => null;
