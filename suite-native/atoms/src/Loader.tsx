import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

type LoaderProps = {
    size?: ActivityIndicatorProps['size'];
    title?: string;
    color?: Color;
};

// TODO: modify component to fit Figma design.
// issue: https://github.com/trezor/trezor-suite/issues/7538
export const Loader = ({ size, title, color = 'backgroundPrimaryDefault' }: LoaderProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <Box>
            <ActivityIndicator size={size} color={colors[color]} />
            {title && (
                <Text variant="label" color="textSubdued" textAlign="center">
                    {title}
                </Text>
            )}
        </Box>
    );
};
