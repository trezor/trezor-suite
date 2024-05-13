import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation, TxKeyPath } from '@suite-native/intl';

import { Box } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

type TextDividerProps = {
    title: TxKeyPath;
    horizontalMargin?: number;
};

const separatorStyle = prepareNativeStyle<{ horizontalMargin?: number }>(
    (utils, { horizontalMargin }) => ({
        borderColor: utils.colors.borderElevation0,
        borderWidth: utils.borders.widths.small,
        flex: 1,
        // We want the separator to be full width, but we need to offset it by the parent padding
        marginHorizontal: typeof horizontalMargin === 'number' ? -horizontalMargin : 0,
    }),
);

const separatorTitleStyle = prepareNativeStyle(_ => ({
    paddingHorizontal: 12,
}));

export const TextDivider = ({ title, horizontalMargin = 0 }: TextDividerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack alignItems="center">
            <Box style={applyStyle(separatorStyle, { horizontalMargin })} />
            <Box style={applyStyle(separatorTitleStyle)}>
                <Text>
                    <Translation id={title} />
                </Text>
            </Box>
            <Box style={applyStyle(separatorStyle, { horizontalMargin })} />
        </HStack>
    );
};
