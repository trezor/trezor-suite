import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

type TextDividerProps = {
    title: TxKeyPath;
    horizontalMargin?: number;
    lineColor?: Color;
    textColor?: Color;
};

const separatorStyle = prepareNativeStyle<{ horizontalMargin?: number; color: Color }>(
    (utils, { horizontalMargin, color }) => ({
        backgroundColor: utils.colors[color],
        height: utils.borders.widths.small,
        flex: 1,
        // We want the separator to be full width, but we need to offset it by the parent padding
        marginHorizontal: typeof horizontalMargin === 'number' ? -horizontalMargin : 0,
    }),
);

const separatorTitleStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: 12,
    paddingVertical: utils.spacings.extraSmall,
}));

export const TextDivider = ({
    title,
    horizontalMargin = 0,
    lineColor = 'borderElevation1',
    textColor = 'textDefault',
}: TextDividerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack alignItems="center">
            <Box style={applyStyle(separatorStyle, { horizontalMargin, color: lineColor })} />
            <Box style={applyStyle(separatorTitleStyle)}>
                <Text variant="label" color={textColor}>
                    <Translation id={title} />
                </Text>
            </Box>
            <Box style={applyStyle(separatorStyle, { horizontalMargin, color: lineColor })} />
        </HStack>
    );
};
