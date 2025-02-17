import { isAndroid } from '@trezor/env-utils';
import { prepareNativeStyle } from '@trezor/styles';

export const resetLetterSpacingOnAndroidStyle = prepareNativeStyle(_ => ({
    // Because of this RN issue https://github.com/facebook/react-native/issues/46436
    // turning off custom letter spacing on Android for selected places only.
    // This is hopefully temporary solution only for places where it was reported and looks too bad.
    extend: {
        condition: isAndroid(),
        style: {
            letterSpacing: 0,
        },
    },
}));
