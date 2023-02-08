import { ActivityIndicator } from 'react-native';
import React from 'react';

import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

type LoaderProps = {
    title?: string;
    color?: Color;
};

// TODO: modify component to fit Figma design.
// issue: https://github.com/trezor/trezor-suite/issues/7538
export const Loader = ({ title, color = 'forest' }: LoaderProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();
    return (
        <Box>
            <ActivityIndicator size="large" color={colors[color]} />
            {title && (
                <Text variant="label" color="gray600">
                    {title}
                </Text>
            )}
        </Box>
    );
};
