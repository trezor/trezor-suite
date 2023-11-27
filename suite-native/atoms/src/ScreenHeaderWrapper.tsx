import { ReactNode } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from './Box';

type ScreenHeaderWrapperProps = {
    children: ReactNode;
} & BoxProps;

const screenHeaderWrapperStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    (utils, { insets }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: Math.max(insets.left, utils.spacings.medium),
        paddingRight: Math.max(insets.right, utils.spacings.medium),
        paddingVertical: utils.spacings.medium,
        paddingBottom: utils.spacings.extraSmall * 3,
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
