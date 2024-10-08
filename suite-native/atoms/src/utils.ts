import { nativeBorders, NativeRadius, NativeSpacing, nativeSpacings } from '@trezor/theme';

export const nativeSpacingToNumber = (value: NativeSpacing | number) =>
    typeof value === 'number' ? value : nativeSpacings[value];

export const nativeRadiusToNumber = (value: NativeRadius | number) =>
    typeof value === 'number' ? value : nativeBorders.radii[value];
