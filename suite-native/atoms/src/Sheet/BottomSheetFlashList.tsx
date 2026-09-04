import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomSheetBackdrop,
    BottomSheetFooter,
    type BottomSheetFooterProps,
    type BottomSheetHandleProps,
    BottomSheetModal,
    useBottomSheetScrollableCreator,
} from '@gorhom/bottom-sheet';
import { FlashList, type FlashListProps, type FlashListRef } from '@shopify/flash-list';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { EdgeFades } from '../EdgeFades';
import { useBottomSheetInteractionGate } from './hooks/useBottomSheetInteractionGate';

type FlashListRenderItem<TItem> = NonNullable<FlashListProps<TItem>['renderItem']>;
type FlashListRenderItemInfo<TItem> = Parameters<FlashListRenderItem<TItem>>[0];

export type BottomSheetFlashListControls = {
    closeSheet: () => void;
};

export type BottomSheetFlashListHandleProps = BottomSheetHandleProps & {
    closeSheet: BottomSheetFlashListControls['closeSheet'];
};

const EDGE_FADE_START_SIZE = 20;
const EDGE_FADE_END_SIZE = 220;

export type BottomSheetFlashListProps<TItem> = {
    showEdgeFades?: boolean;
    footer?: ReactNode;
    isVisible: boolean;
    onClose: (shouldHideKeyboard?: boolean) => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    estimatedListHeight?: number;
    handleComponent?: ((props: BottomSheetFlashListHandleProps) => ReactNode) | null;
    scrollResetKey?: string;
    renderItem: (
        info: FlashListRenderItemInfo<TItem>,
        sheetControls: BottomSheetFlashListControls,
    ) => ReturnType<FlashListRenderItem<TItem>>;
} & Omit<FlashListProps<TItem>, 'renderItem'>;

const bottomSheetStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillPage,

    borderTopLeftRadius: utils.borders.radii.r20,
    borderTopRightRadius: utils.borders.radii.r20,
}));

const sheetContentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
    isSheetSettled: boolean;
}>((utils, { insetBottom, isSheetSettled }) => ({
    paddingBottom: insetBottom + utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
    pointerEvents: isSheetSettled ? 'auto' : 'none',
}));

const handleStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.borderNeutral,
}));

const footerStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.surfaceFillPage,
}));

const WindowOverlay = ({ children }: { children: ReactNode }) => (
    <View style={StyleSheet.absoluteFill}>{children}</View>
);

export const BottomSheetFlashList = <TItem,>({
    isVisible,
    onClose,
    title,
    subtitle,
    estimatedListHeight = 0,
    handleComponent,
    footer,
    scrollResetKey,
    renderItem,
    contentContainerStyle,
    showEdgeFades,
    ...flashListProps
}: BottomSheetFlashListProps<TItem>) => {
    const { applyStyle } = useNativeStyles();
    const { bottom: insetBottom } = useSafeAreaInsets();

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const flashListRef = useRef<FlashListRef<TItem>>(null);
    const { animatedIndex, isSheetSettled } = useBottomSheetInteractionGate();
    const [footerHeight, setFooterHeight] = useState(0);

    // Imperative scroll reset.
    useEffect(() => {
        if (isVisible) {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
    }, [scrollResetKey, isVisible]);

    const dismissSheet = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);

    const handleDismiss = useCallback(() => {
        onClose(false);
    }, [onClose]);

    const renderHandleComponent = useCallback(
        (props: BottomSheetHandleProps) => {
            const handle = handleComponent?.({
                ...props,
                closeSheet: dismissSheet,
            });

            if (handle === undefined || handle === null) {
                return undefined;
            }

            return <Box pointerEvents={isSheetSettled ? 'auto' : 'none'}>{handle}</Box>;
        },
        [dismissSheet, handleComponent, isSheetSettled],
    );

    const renderFlashListItem = useCallback(
        (info: FlashListRenderItemInfo<TItem>) => renderItem(info, { closeSheet: dismissSheet }),
        [renderItem, dismissSheet],
    );

    const renderFooter = useCallback(
        ({ animatedFooterPosition }: BottomSheetFooterProps) => (
            <BottomSheetFooter
                animatedFooterPosition={animatedFooterPosition}
                bottomInset={insetBottom}
                style={applyStyle(footerStyle)}
            >
                <Box
                    onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}
                    pointerEvents={isSheetSettled ? 'auto' : 'none'}
                >
                    {footer}
                </Box>
            </BottomSheetFooter>
        ),
        [applyStyle, footer, insetBottom, isSheetSettled],
    );

    const maxHeight = Dimensions.get('window').height * 0.9;
    const minHeight = Math.max(Dimensions.get('window').height * 0.4, estimatedListHeight);
    // minHeight can be higher than maxHeight because of estimatedListHeight, but it must be capped by maxHeight
    const snapPoints = useMemo(() => [Math.min(minHeight, maxHeight)], [minHeight, maxHeight]);

    useEffect(() => {
        if (isVisible) {
            bottomSheetModalRef.current?.present();
        } else {
            dismissSheet();
        }
    }, [dismissSheet, isVisible]);

    const BottomSheetListScrollComponent = useBottomSheetScrollableCreator();

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            animatedIndex={animatedIndex}
            snapPoints={snapPoints}
            maxDynamicContentSize={maxHeight}
            enableDynamicSizing={false}
            footerComponent={footer ? renderFooter : undefined}
            onDismiss={handleDismiss}
            backdropComponent={props => (
                <BottomSheetBackdrop
                    {...props}
                    onPress={dismissSheet}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            )}
            backgroundStyle={applyStyle(bottomSheetStyle)}
            handleIndicatorStyle={applyStyle(handleStyle)}
            // @ts-expect-error wrong type, doesn't expect children
            containerComponent={WindowOverlay}
            handleComponent={renderHandleComponent}
            keyboardBlurBehavior="restore"
            keyboardBehavior="fillParent"
        >
            <FlashList
                ref={flashListRef}
                maintainVisibleContentPosition={{ disabled: true }}
                renderScrollComponent={BottomSheetListScrollComponent}
                renderItem={renderFlashListItem}
                contentContainerStyle={[
                    contentContainerStyle,
                    applyStyle(sheetContentContainerStyle, {
                        insetBottom: footer ? footerHeight + insetBottom : insetBottom,
                        isSheetSettled,
                    }),
                ]}
                {...flashListProps}
            />
            {showEdgeFades && (
                <EdgeFades
                    direction="vertical"
                    startSize={EDGE_FADE_START_SIZE}
                    endSize={EDGE_FADE_END_SIZE}
                />
            )}
        </BottomSheetModal>
    );
};
