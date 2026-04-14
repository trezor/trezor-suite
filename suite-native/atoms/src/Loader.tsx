import { type ReactNode } from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

export type LoaderProps = {
    size?: ActivityIndicatorProps['size'];
    title?: ReactNode;
    color?: Color;
};

// TODO: modify component to fit Figma design.
// issue: https://github.com/trezor/trezor-suite/issues/7538
export const Loader = ({ size, title, color = 'legacyBackgroundPrimaryDefault' }: LoaderProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <Box>
            <ActivityIndicator size={size} color={colors[color]} />
            {title && (
                <Text variant="body-xs" color="contentSecondary" textAlign="center">
                    {title}
                </Text>
            )}
        </Box>
    );
};
