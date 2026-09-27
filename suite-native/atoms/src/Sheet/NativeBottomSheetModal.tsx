import { forwardRef, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import {
    Keyboard,
    type KeyboardEvent,
    Platform,
    ScrollView,
    View,
    type ViewProps,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetModal as ExpoBottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { useScrollDivider } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { BottomSheetHeader } from './BottomSheetHeader';
import { type BottomSheetModalProps } from './LegacyBottomSheetModal';
import { NativeSheetPresentationContext } from './NativeSheetContext';

const containerStyle = prepareNativeStyle<{ maxHeight: number; hasSnapPoints: boolean }>(
    ({ colors }, { maxHeight, hasSnapPoints }) => ({
        backgroundColor: colors.surfaceFillPage,
        maxHeight,
        flexShrink: 1,
        ...(hasSnapPoints ? { flex: 1 } : {}),
    }),
);

const scrollStyle = prepareNativeStyle(() => ({ flexShrink: 1, flexGrow: 0 }));
const backgroundStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.surfaceFillPage,
}));

type NativeSheetContentProps = ViewProps & { hasSnapPoints: boolean };

const NativeSheetContent = ({ hasSnapPoints, children, onLayout }: NativeSheetContentProps) => {
    const { width, height } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const { applyStyle } = useNativeStyles();
    const [keyboardFrame, setKeyboardFrame] = useState(() => Keyboard.metrics());
    let keyboardHeight = keyboardFrame?.height ?? 0;
    if (Platform.OS === 'ios' && keyboardFrame) {
        // RN converts iOS keyboard frames into the current window's coordinates.
        const isDocked =
            keyboardFrame.screenX <= 0 &&
            keyboardFrame.screenX + keyboardFrame.width >= width &&
            keyboardFrame.screenY + keyboardFrame.height >= height;
        keyboardHeight = isDocked ? Math.max(0, height - keyboardFrame.screenY) : 0;
    }

    useEffect(() => {
        const updateFrame = (event: KeyboardEvent) => setKeyboardFrame(event.endCoordinates);
        const clearFrame = () => setKeyboardFrame(undefined);
        const subscriptions = [
            Keyboard.addListener('keyboardDidShow', updateFrame),
            Keyboard.addListener('keyboardDidHide', clearFrame),
        ];
        if (Platform.OS === 'ios') {
            subscriptions.push(
                Keyboard.addListener('keyboardWillShow', updateFrame),
                Keyboard.addListener('keyboardWillHide', clearFrame),
                Keyboard.addListener('keyboardWillChangeFrame', updateFrame),
                Keyboard.addListener('keyboardDidChangeFrame', updateFrame),
            );
        }

        return () => subscriptions.forEach(subscription => subscription.remove());
    }, []);

    return (
        <View
            testID="@native-sheet/content"
            onLayout={onLayout}
            style={applyStyle(containerStyle, {
                maxHeight: Math.max(0, height - top - 72 - keyboardHeight),
                hasSnapPoints,
            })}
        >
            {children}
        </View>
    );
};

export type NativeBottomSheetModalProps = BottomSheetModalProps & {
    onPresented: () => boolean;
    onCloseRequested: () => void;
};

export const NativeBottomSheetModal = forwardRef<
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
            bottomSheetCustomProps = {},
            onClose,
            onDismiss,
            onPresented,
            onCloseRequested,
            ...contentProps
        },
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();
        const { scrollDivider, handleScroll } = useScrollDivider();
        const isContentMounted = useRef(false);
        const isNativePresented = useRef(false);
        const hasNotifiedPresentation = useRef(false);
        const pendingIndex = useRef<number | undefined>(undefined);
        const [presentationKey, setPresentationKey] = useState(0);
        const [isPresentationReady, setIsPresentationReady] = useState(false);
        const notifyDismissed = useEffectEvent(() => onDismiss?.());

        useLayoutEffect(() => {
            if (presentationKey > 0) notifyDismissed();
        }, [presentationKey]);
        const {
            snapPoints,
            index,
            enableDynamicSizing,
            enablePanDownToClose = true,
            backgroundStyle: customBackgroundStyle,
            onChange,
        } = bottomSheetCustomProps;
        const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;

        const handleChange = (nextIndex: number) => {
            if (nextIndex >= 0 && !hasNotifiedPresentation.current) {
                pendingIndex.current = nextIndex;
            } else {
                onChange?.(nextIndex);
            }
        };

        const notifyPresented = () => {
            if (
                hasNotifiedPresentation.current ||
                !isContentMounted.current ||
                !isNativePresented.current
            ) {
                return;
            }

            hasNotifiedPresentation.current = true;
            const shouldNotifyOpening = onPresented();
            setIsPresentationReady(shouldNotifyOpening);
            if (shouldNotifyOpening && pendingIndex.current !== undefined) {
                onChange?.(pendingIndex.current);
            }
            pendingIndex.current = undefined;
        };

        const handleContentLayout = () => {
            isContentMounted.current = true;
            notifyPresented();
        };

        const handleDidPresent = () => {
            isNativePresented.current = true;
            notifyPresented();
        };

        const handleDismiss = () => {
            isContentMounted.current = false;
            isNativePresented.current = false;
            hasNotifiedPresentation.current = false;
            setIsPresentationReady(false);
            pendingIndex.current = undefined;
            // Expo can batch a queued reopen with its closing state. Commit a fresh closed host first.
            setPresentationKey(key => key + 1);
        };

        const handleClose = () => {
            onClose?.();
            onCloseRequested();
        };

        return (
            <ExpoBottomSheetModal
                key={presentationKey}
                ref={ref}
                snapPoints={Array.isArray(snapPoints) ? snapPoints : undefined}
                index={index}
                enableDynamicSizing={enableDynamicSizing}
                enablePanDownToClose={enablePanDownToClose}
                backgroundStyle={customBackgroundStyle ?? applyStyle(backgroundStyle)}
                onChange={handleChange}
                onDidPresent={handleDidPresent}
                onDismiss={handleDismiss}
            >
                <NativeSheetPresentationContext.Provider value={isPresentationReady}>
                    <NativeSheetContent
                        onLayout={handleContentLayout}
                        hasSnapPoints={hasSnapPoints}
                    >
                        <BottomSheetHeader
                            title={title}
                            subtitle={subtitle}
                            isCloseDisplayed={isCloseDisplayed}
                            onCloseSheet={handleClose}
                            scrollDivider={scrollDivider}
                            isGrabberDisplayed={false}
                        />
                        <ScrollView
                            style={applyStyle(scrollStyle)}
                            onScroll={handleScroll}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            automaticallyAdjustKeyboardInsets
                            showsVerticalScrollIndicator
                            testID="@bottom-sheet/scroll-view"
                        >
                            <Box marginHorizontal="sp16" paddingBottom="sp16" {...contentProps}>
                                {children}
                            </Box>
                        </ScrollView>
                        {!!footer && <Box flexShrink={0}>{footer}</Box>}
                    </NativeSheetContent>
                </NativeSheetPresentationContext.Provider>
            </ExpoBottomSheetModal>
        );
    },
);
