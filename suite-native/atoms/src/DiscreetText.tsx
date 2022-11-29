import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { useAtom, atom } from 'jotai';
import { Blur, Canvas, Text as SkiaText, useFont } from '@shopify/react-native-skia';

import { Color, TypographyStyle, typographyStylesBase } from '@trezor/theme';

import { Text } from './Text';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const satoshiFont = require('../../../packages/theme/fonts/TTSatoshi-Regular.otf');

type DiscreetValueProps = {
    typography?: TypographyStyle;
    color?: Color;
    formattedAmount: string;
};

export const isDiscreetModeOn = atom(true);

const DiscreetCanvas = ({
    width,
    height,
    fontSize,
    formattedAmount,
}: {
    width: number;
    height: number;
    fontSize: number;
    formattedAmount: string;
}) => {
    const font = useFont(satoshiFont, fontSize);
    if (!font) return null;
    return (
        <Canvas style={{ height, width }}>
            <SkiaText x={0} y={fontSize} text={formattedAmount} font={font} />
            <Blur blur={15} mode="decal" />
        </Canvas>
    );
};

export const DiscreetText = ({
    formattedAmount,
    color = 'gray800',
    typography = 'body',
}: DiscreetValueProps) => {
    const [isDiscreetMode] = useAtom(isDiscreetModeOn);
    const [width, setWidth] = useState(0);
    const { lineHeight, fontSize } = typographyStylesBase[typography];

    const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
    }, []);

    const textElement = useMemo(
        () => (
            <Text variant={typography} color={color} onLayout={handleLayout}>
                {formattedAmount}
            </Text>
        ),
        [color, formattedAmount, handleLayout, typography],
    );

    if (isDiscreetMode) {
        return (
            <DiscreetCanvas
                width={width}
                height={lineHeight}
                fontSize={fontSize}
                formattedAmount={formattedAmount}
            />
        );
    }
    return textElement;
};
