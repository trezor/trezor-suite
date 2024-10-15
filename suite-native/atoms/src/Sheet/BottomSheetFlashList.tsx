import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetFlashList as FlashList,
} from '@gorhom/bottom-sheet';
import { FlashListProps } from '@shopify/flash-list';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type BottomSheetFlashListProps<TItem> = {
    isVisible: boolean;
    isCloseDisplayed?: boolean;
    onClose: (isVisible: boolean) => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    estimatedListHeight?: number;
} & FlashListProps<TItem>;

const DEFAULT_INSET_BOTTOM = 25;

const bottomSheetStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,

    borderTopLeftRadius: utils.borders.radii.r20,
    borderTopRightRadius: utils.borders.radii.r20,
}));

const sheetContentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
    paddingHorizontal: utils.spacings.sp16,
}));

const handleStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.borderDashed,
}));

const WindowOverlay = ({ children }: { children: ReactNode }) => {
    return <View style={StyleSheet.absoluteFill}>{children}</View>;
};

export const BottomSheetFlashList = <TItem,>({
    isVisible,
    isCloseDisplayed = true,
    onClose,
    title,
    subtitle,
    estimatedListHeight = 0,
    ...flashListProps
}: BottomSheetFlashListProps<TItem>) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const handleClose = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
        onClose(false);
    }, [onClose]);

    const insetBottom = Math.max(insets.bottom, DEFAULT_INSET_BOTTOM);

    const maxHeight = Dimensions.get('window').height * 0.9;
    const minHeight = Math.max(Dimensions.get('window').height * 0.4, estimatedListHeight);
    // minHeight can be higher than maxHeight because of estimatedListHeight, but it must be capped by maxHeight
    const snapPoints = useMemo(() => [Math.min(minHeight, maxHeight)], [minHeight, maxHeight]);

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) {
                handleClose();
            }
        },
        [handleClose],
    );

    useEffect(() => {
        if (isVisible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [isVisible]);

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={snapPoints}
            maxDynamicContentSize={maxHeight}
            enableDynamicSizing={false}
            onChange={handleSheetChanges}
            backdropComponent={props => (
                <BottomSheetBackdrop
                    {...props}
                    onPress={handleClose}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            )}
            backgroundStyle={applyStyle(bottomSheetStyle)}
            handleIndicatorStyle={applyStyle(handleStyle)}
            // @ts-expect-error wrong type, doesn't expect children
            containerComponent={WindowOverlay}
        >
            <FlashList
                {...flashListProps}
                contentContainerStyle={applyStyle(sheetContentContainerStyle, {
                    insetBottom,
                })}
            />
        </BottomSheetModal>
    );
};
