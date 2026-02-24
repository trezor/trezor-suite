import { useCallback, useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// approximate height of the navigation header excluding the status bar
// status bar is taken into account with `useSafeAreaInsets`
export const HEADER_HEIGHT = 100;
export const HORIZONTAL_MARGIN = 20;

export const useAvailableScreenSquare = (minimumSize: number, maximumSize: number) => {
    const { height, width } = useWindowDimensions();
    const { top, bottom, left, right } = useSafeAreaInsets();
    const [contentHeight, setContentHeight] = useState(0);

    const handleContentLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
        setContentHeight(nativeEvent.layout.height);
    }, []);

    const availableHeight = height - HEADER_HEIGHT - top - bottom;
    const availableWidth = width - HORIZONTAL_MARGIN - left - right;

    let squareSize = availableHeight - contentHeight;
    if (squareSize < minimumSize) {
        squareSize = minimumSize;
    } else if (squareSize > maximumSize) {
        squareSize = maximumSize;
    }

    if (squareSize > availableWidth) {
        squareSize = availableWidth;
    }

    return {
        squareSize,
        handleContentLayout,
    };
};
