import { useMemo, useState } from 'react';
import { LayoutChangeEvent, PixelRatio } from 'react-native';

import { useNativeStyles } from '@trezor/styles';
import { NativeTypographyStyle } from '@trezor/theme';

export const useIsMultiline = (fontType: NativeTypographyStyle = 'titleMedium') => {
    const [isMultiline, setIsMultiline] = useState<boolean | null>(false);
    const {
        utils: { typography },
    } = useNativeStyles();

    const { lineHeight } = typography[fontType];

    const fontScale = PixelRatio.getFontScale();
    const scaledLineHeight = useMemo(() => lineHeight * fontScale, [fontScale, lineHeight]);

    const onTextLayout = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        const numOfLines = Math.floor(height / scaledLineHeight);
        setIsMultiline(numOfLines > 1);
    };

    return { onTextLayout, isMultiline };
};
