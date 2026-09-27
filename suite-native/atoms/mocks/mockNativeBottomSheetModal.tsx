import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { Box } from '../src/Box';
import { BottomSheetHeader } from '../src/Sheet/BottomSheetHeader';
import { type NativeBottomSheetModalProps } from '../src/Sheet/NativeBottomSheetModal';

export const mockNativeBottomSheetModal = forwardRef<
    BottomSheetModalMethods,
    NativeBottomSheetModalProps
>(
    (
        {
            children,
            footer,
            title,
            subtitle,
            isCloseDisplayed = false,
            bottomSheetCustomProps,
            onClose,
            onDismiss,
            onPresented,
            onCloseRequested,
            ...contentProps
        },
        ref,
    ) => {
        const [isVisible, setIsVisible] = useState(false);
        const wasVisible = useRef(false);
        const onChange = bottomSheetCustomProps?.onChange;
        const initialIndex = bottomSheetCustomProps?.index ?? 0;

        useImperativeHandle(ref, () => ({
            present: () => setIsVisible(true),
            dismiss: () => setIsVisible(false),
            close: () => setIsVisible(false),
            forceClose: () => setIsVisible(false),
            expand: jest.fn(),
            collapse: jest.fn(),
            snapToIndex: jest.fn(),
            snapToPosition: jest.fn(),
        }));

        useLayoutEffect(() => {
            if (isVisible === wasVisible.current) return;

            wasVisible.current = isVisible;
            if (isVisible) {
                // Notify only after the content refs mount, just as the native layout callback does.
                if (onPresented()) onChange?.(initialIndex);
            } else {
                onChange?.(-1);
                onDismiss?.();
            }
        }, [initialIndex, isVisible, onChange, onDismiss, onPresented]);

        if (!isVisible) return null;

        const handleClose = () => {
            onClose?.();
            onCloseRequested();
        };

        return (
            <View
                testID="@native-sheet/content"
                onAccessibilityEscape={
                    bottomSheetCustomProps?.enablePanDownToClose === false
                        ? undefined
                        : () => setIsVisible(false)
                }
            >
                <BottomSheetHeader
                    title={title}
                    subtitle={subtitle}
                    isCloseDisplayed={isCloseDisplayed}
                    isGrabberDisplayed={false}
                    onCloseSheet={handleClose}
                />
                <Box {...contentProps}>{children}</Box>
                {footer}
            </View>
        );
    },
);
