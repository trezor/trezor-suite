import { ReactNode, forwardRef, useCallback, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal as BottomSheetModalBase,
    BottomSheetScrollView,
    BottomSheetScrollViewMethods,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { useScrollDivider } from '@suite-native/navigation';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AnimatedBox, BoxProps } from '../Box';
import { BottomSheetHeader } from './BottomSheetHeader';

const SCREEN_HEIGHT = getScreenHeight();
const MAX_HEIGHT = SCREEN_HEIGHT * 0.9;

export type BottomSheetModalProps = {
    children: ReactNode;
    footer?: ReactNode;
    title?: string;
    subtitle?: string;
    isCloseDisplayed?: boolean;
    onDismiss?: () => void;
} & BoxProps;

const containerStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const childWrapperStyle = prepareNativeStyle<{ bottomInset?: number }>(
    (utils, { bottomInset }) => ({
        flex: 1,
        paddingBottom: bottomInset || utils.spacings.sp16,
    }),
);

const backgroundStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

export const BottomSheetModal = forwardRef<BottomSheetModalMethods, BottomSheetModalProps>(
    (
        { children, footer, style, title, isCloseDisplayed = false, subtitle, onDismiss, ...rest },
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();
        const { bottom } = useSafeAreaInsets();

        const scrollViewRef = useRef<BottomSheetScrollViewMethods>(null);

        const { scrollDivider, handleScroll } = useScrollDivider();

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props} />
            ),
            [],
        );

        const onCloseModal = useCallback(() => {
            if (onDismiss) {
                onDismiss();
            }
            if (ref && 'current' in ref && ref.current) {
                ref.current.dismiss();
            }
        }, [ref, onDismiss]);

        return (
            <GestureHandlerRootView style={applyStyle(containerStyle)}>
                <BottomSheetModalBase
                    ref={ref}
                    backdropComponent={renderBackdrop}
                    maxDynamicContentSize={MAX_HEIGHT}
                    backgroundStyle={applyStyle(backgroundStyle)}
                    handleComponent={() => (
                        <BottomSheetHeader
                            title={title}
                            subtitle={subtitle}
                            isCloseDisplayed={isCloseDisplayed}
                            onCloseSheet={onCloseModal}
                            scrollDivider={scrollDivider}
                        />
                    )}
                    onDismiss={onDismiss}
                >
                    <BottomSheetScrollView
                        style={applyStyle(containerStyle)}
                        ref={scrollViewRef}
                        onScroll={handleScroll}
                        testID="@bottom-sheet/scroll-view"
                    >
                        <AnimatedBox
                            paddingHorizontal="sp16"
                            style={[applyStyle(childWrapperStyle, { bottomInset: bottom }), style]}
                            {...rest}
                        >
                            {children}
                        </AnimatedBox>
                    </BottomSheetScrollView>
                    {footer}
                </BottomSheetModalBase>
            </GestureHandlerRootView>
        );
    },
);
