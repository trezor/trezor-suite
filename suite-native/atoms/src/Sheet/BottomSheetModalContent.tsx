import { memo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AnimatedBox, BoxProps } from '../Box';

const childWrapperStyle = prepareNativeStyle<{ bottomInset?: number }>(
    (utils, { bottomInset }) => ({
        flex: 1,
        paddingBottom: bottomInset || utils.spacings.sp16,
        paddingHorizontal: utils.spacings.sp16,
    }),
);

const containerStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

interface BottomSheetModalContentProps extends BoxProps {
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const BottomSheetModalContent = memo<BottomSheetModalContentProps>(
    ({ handleScroll, style, children, ...rest }) => {
        const { applyStyle } = useNativeStyles();

        const { bottom } = useSafeAreaInsets();

        return (
            <BottomSheetScrollView
                style={applyStyle(containerStyle)}
                onScroll={handleScroll}
                testID="@bottom-sheet/scroll-view"
            >
                <AnimatedBox
                    style={[applyStyle(childWrapperStyle, { bottomInset: bottom }), style]}
                    {...rest}
                >
                    {children}
                </AnimatedBox>
            </BottomSheetScrollView>
        );
    },
);
