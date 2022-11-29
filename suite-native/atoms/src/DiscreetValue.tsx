import React from 'react';

import { useAtom, atom } from 'jotai';
import { Blur, Canvas, Text, useFont } from '@shopify/react-native-skia';

import { Color, TypographyStyle, typographyStylesBase } from '@trezor/theme';

import { Text as AtomText } from './Text';
import { Box } from './Box';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const satoshiFont = require('../../../packages/theme/fonts/TTSatoshi-Regular.otf');

type DiscreetValueProps = {
    typography?: TypographyStyle;
    color?: Color;
    children: string;
};

export const isDiscreetModeOn = atom(true);

export const DiscreetValue = ({
    children,
    color = 'gray800',
    typography = 'body',
}: DiscreetValueProps) => {
    const [isDiscreetMode] = useAtom(isDiscreetModeOn);
    const { lineHeight, fontSize } = typographyStylesBase[typography];
    const font = useFont(satoshiFont, fontSize);

    if (isDiscreetMode && font) {
        return (
            <Canvas style={{ height: lineHeight, width: 70 }}>
                <Text x={0} y={fontSize} text={children} font={font} />
                <Blur blur={15} mode="decal" />
            </Canvas>
        );
    }
    return (
        <AtomText variant={typography} color={color}>
            {children}
        </AtomText>
    );
};
