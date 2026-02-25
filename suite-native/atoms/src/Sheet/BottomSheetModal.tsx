import { ReactNode, Ref, forwardRef, useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFooter,
    BottomSheetFooterProps,
    BottomSheetModal as BottomSheetModalBase,
    BottomSheetModalProps as BottomSheetModalBaseProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { useScrollDivider } from '@suite-native/scrollview';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from '../Box';
import { BottomSheetHeader } from './BottomSheetHeader';
import { BottomSheetModalContent } from './BottomSheetModalContent';

const TOP_OFFSET = 72; // corresponds to screen header size
const MAX_MODAL_HEIGHT = getScreenHeight() - TOP_OFFSET;

export type BottomSheetModalProps = {
    children: ReactNode;
    footer?: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    isCloseDisplayed?: boolean;
    bottomSheetCustomProps?: Partial<BottomSheetModalBaseProps>;
    // triggered when the close button is pressed
    onClose?: () => void;
    // triggered Always when the modal is dismissed
    onDismiss?: () => void;
} & BoxProps;

const backgroundStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.backgroundSurfaceElevation0,
}));

const footerStyle = prepareNativeStyle<{ bottomInset: number }>(({ colors }, { bottomInset }) => ({
    backgroundColor: colors.backgroundSurfaceElevation0,
    paddingBottom: bottomInset,
}));

export type BottomSheetModalRef = Ref<BottomSheetModalMethods>;

export const BottomSheetModal = forwardRef<BottomSheetModalMethods, BottomSheetModalProps>(
    (
        {
            children,
            footer,
            title,
            isCloseDisplayed = false,
            subtitle,
            onDismiss,
            bottomSheetCustomProps = {},
            onClose,
            ...rest
        },
        ref,
    ) => {
        const { top, bottom } = useSafeAreaInsets();
        const { applyStyle } = useNativeStyles();
        const { scrollDivider, handleScroll } = useScrollDivider();

        const [footerHeight, setFooterHeight] = useState(0);

        // This ensures that the bottom sheet content evades the footer if present.
        // In case footerHeight > TOP_OFFSET, the content and footer might collide.
        const maxDynamicContentSize = MAX_MODAL_HEIGHT - top + footerHeight;

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props} />
            ),
            [],
        );

        const onCloseModal = useCallback(() => {
            onClose?.();
            if (ref && 'current' in ref && ref.current) {
                ref.current.dismiss();
            }
        }, [ref, onClose]);

        return (
            <BottomSheetModalBase
                ref={ref}
                maxDynamicContentSize={maxDynamicContentSize}
                backgroundStyle={applyStyle(backgroundStyle)}
                backdropComponent={renderBackdrop}
                keyboardBlurBehavior="restore"
                handleComponent={() => (
                    <BottomSheetHeader
                        title={title}
                        subtitle={subtitle}
                        isCloseDisplayed={isCloseDisplayed}
                        onCloseSheet={onCloseModal}
                        scrollDivider={scrollDivider}
                    />
                )}
                footerComponent={({ animatedFooterPosition }: BottomSheetFooterProps) => (
                    <BottomSheetFooter
                        animatedFooterPosition={animatedFooterPosition}
                        style={applyStyle(footerStyle, { bottomInset: footer ? bottom : 0 })}
                    >
                        <Box onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}>
                            {footer}
                        </Box>
                    </BottomSheetFooter>
                )}
                onDismiss={onDismiss}
                {...bottomSheetCustomProps}
            >
                <BottomSheetModalContent
                    handleScroll={handleScroll}
                    bottomInset={bottom + footerHeight}
                    {...rest}
                >
                    {children}
                </BottomSheetModalContent>
            </BottomSheetModalBase>
        );
    },
);
