import { Box, type BoxProps } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useTradingDebugModeFlag } from '../hooks/useTradingDebugModeFlag';

export type DebugModeViewProps = BoxProps;

const DebugModeViewStyle = prepareNativeStyle(({ colors, spacings }) => ({
    marginHorizontal: spacings.sp4,
    marginVertical: spacings.sp2,
    paddingHorizontal: spacings.sp4,
    paddingVertical: spacings.sp2,
    borderWidth: 1,
    borderColor: colors.borderInputDefault,
    backgroundColor: colors.backgroundNeutralDisabled,
}));

export const DebugModeView = ({ style, ...otherProps }: DebugModeViewProps) => {
    const isDebugModeEnabled = useTradingDebugModeFlag();
    const { applyStyle } = useNativeStyles();

    if (!isDebugModeEnabled) {
        return null;
    }

    return <Box style={[applyStyle(DebugModeViewStyle), style]} {...otherProps} />;
};
