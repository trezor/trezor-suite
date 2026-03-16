import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    type TileStyles,
    type TileVariant,
    variantToColorMap,
    variantToIconName,
    variantToLabel,
} from './presets';

type MarqueeTileProps = {
    variant: TileVariant;
};

const buttonStyle = prepareNativeStyle<Pick<TileStyles, 'borderColor' | 'backgroundColor'>>(
    (utils, { backgroundColor, borderColor }) => ({
        minWidth: 167,
        backgroundColor: utils.colors[backgroundColor],
        paddingVertical: utils.spacings.sp10,
        paddingHorizontal: utils.spacings.sp16,
        borderRadius: utils.borders.radii.r8,
        borderWidth: 1,
        borderColor: utils.colors[borderColor],
        gap: utils.spacings.sp12,
    }),
);

const textStyle = prepareNativeStyle<Pick<TileStyles, 'text'>>((utils, { text }) => ({
    color: utils.colors[text],
}));

export const MarqueeTile = ({ variant }: MarqueeTileProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, text } = variantToColorMap[variant];

    return (
        <Box
            style={applyStyle(buttonStyle, { backgroundColor, borderColor })}
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
        >
            <Icon name={variantToIconName[variant]} size="large" color={text} />
            <Text textAlign="center" variant="headline-sm" style={applyStyle(textStyle, { text })}>
                <Translation id={variantToLabel[variant]} />
            </Text>
        </Box>
    );
};
