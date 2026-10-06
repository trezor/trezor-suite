import { type ReactNode } from 'react';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box, type BoxProps } from './Box';

type ScreenHeaderWrapperProps = {
    children: ReactNode;
    noBottomPadding?: boolean;
} & BoxProps;

const screenHeaderWrapperStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    noBottomPadding: boolean;
}>((utils, { insets, noBottomPadding }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: Math.max(insets.left, utils.spacings.sp16),
    paddingRight: Math.max(insets.right, utils.spacings.sp16),
    paddingTop: utils.spacings.sp8,
    paddingBottom: noBottomPadding ? 0 : utils.spacings.sp16,
}));

export const ScreenHeaderWrapper = ({
    children,
    noBottomPadding = false,
    ...rest
}: ScreenHeaderWrapperProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <Box style={applyStyle(screenHeaderWrapperStyle, { insets, noBottomPadding })} {...rest}>
            {children}
        </Box>
    );
};
