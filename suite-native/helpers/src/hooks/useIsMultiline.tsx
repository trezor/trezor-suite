import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, PixelRatio } from 'react-native';

import { useNativeStyles } from '@trezor/styles';
import { type NativeTypographyStyle } from '@trezor/theme';

export const useIsMultiline = (fontType: NativeTypographyStyle = 'headline-md') => {
    const [isMultiline, setIsMultiline] = useState<boolean | null>(false);
    const [numberOfLines, setNumberOfLines] = useState<number | null>(null);
    const {
        utils: { typography },
    } = useNativeStyles();

    const { lineHeight } = typography[fontType];

    const fontScale = PixelRatio.getFontScale();
    const scaledLineHeight = useMemo(() => lineHeight * fontScale, [fontScale, lineHeight]);

    const onTextLayout = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        const numOfLines = Math.floor(height / scaledLineHeight);
        setNumberOfLines(numOfLines);
        setIsMultiline(numOfLines > 1);
    };

    return { onTextLayout, isMultiline, numberOfLines };
};
