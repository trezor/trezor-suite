import { ReactNode } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, BoxProps } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ScreenHeaderWrapperProps = {
    children: ReactNode;
} & BoxProps;

const screenHeaderWrapperStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    (utils, { insets }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: Math.max(insets.left, utils.spacings.m),
        paddingRight: Math.max(insets.right, utils.spacings.m),
        paddingVertical: utils.spacings.m,
        paddingBottom: utils.spacings.xs * 3,
        ...utils.boxShadows.s,
    }),
);

export const ScreenHeaderWrapper = ({ children, ...rest }: ScreenHeaderWrapperProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <Box style={applyStyle(screenHeaderWrapperStyle, { insets })} {...rest}>
            {children}
        </Box>
    );
};
