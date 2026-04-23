import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { Image } from '../Image';
import { flagsMap } from './flagsMap';
import { type FlagSize, type FlagType } from './types';
import { mapSizeToBorderRadius, mapSizeToOutlineWidth } from './utils';

const FLAG_ASPECT_RATIO = 30 / 24;

type FlagWrapperStyleProps = {
    size: FlagSize;
};

type FlagContentStyleProps = {
    borderRadius: number;
};

export type FlagProps = {
    country: FlagType;
    size?: FlagSize;
};

const flagWrapperStyle = prepareNativeStyle<FlagWrapperStyleProps>((_, { size }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    flexShrink: 0,
}));

const flagContentStyle = prepareNativeStyle<FlagContentStyleProps>((utils, { borderRadius }) => ({
    width: '100%',
    aspectRatio: FLAG_ASPECT_RATIO,
    overflow: 'hidden',
    borderRadius,
    backgroundColor: utils.colors.elementFillOnDarkContrast,
}));

const flagImageStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: '100%',
}));

const flagOutlineStyle = prepareNativeStyle<FlagContentStyleProps & { outlineWidth: number }>(
    (utils, { borderRadius, outlineWidth }) => ({
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius,
        borderWidth: outlineWidth,
        borderColor: utils.colors.elementBorderNeutralSofter,
    }),
);

export const Flag = ({ country, size = 24 }: FlagProps) => {
    const { applyStyle } = useNativeStyles();
    const borderRadius = mapSizeToBorderRadius(size);
    const outlineWidth = mapSizeToOutlineWidth(size);

    return (
        <Box
            accessibilityLabel={`flag-${country}`}
            accessibilityRole="image"
            style={applyStyle(flagWrapperStyle, {
                size,
            })}
            testID="@atom/flag"
        >
            <Box
                style={applyStyle(flagContentStyle, {
                    borderRadius,
                })}
                testID="@atom/flag/content"
            >
                <Image
                    source={flagsMap[country]}
                    style={applyStyle(flagImageStyle)}
                    contentFit="contain"
                />
                <Box
                    style={applyStyle(flagOutlineStyle, {
                        borderRadius,
                        outlineWidth,
                    })}
                    pointerEvents="none"
                />
            </Box>
        </Box>
    );
};
