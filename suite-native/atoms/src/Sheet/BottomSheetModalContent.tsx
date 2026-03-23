import { memo } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedBox } from '../AnimatedBox';
import { type BoxProps } from '../Box';

const containerStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const childWrapperStyle = prepareNativeStyle<{ bottomInset: number }>(
    ({ spacings }, { bottomInset }) => ({
        flex: 1,
        marginHorizontal: spacings.sp16,
        marginBottom: bottomInset + spacings.sp16,
    }),
);

interface BottomSheetModalContentProps extends BoxProps {
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    bottomInset: number;
}

export const BottomSheetModalContent = memo<BottomSheetModalContentProps>(
    ({ handleScroll, bottomInset, style, children, ...rest }) => {
        const { applyStyle } = useNativeStyles();

        return (
            <BottomSheetScrollView
                style={applyStyle(containerStyle)}
                onScroll={handleScroll}
                testID="@bottom-sheet/scroll-view"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <AnimatedBox
                    style={[applyStyle(childWrapperStyle, { bottomInset }), style]}
                    {...rest}
                >
                    {children}
                </AnimatedBox>
            </BottomSheetScrollView>
        );
    },
);
