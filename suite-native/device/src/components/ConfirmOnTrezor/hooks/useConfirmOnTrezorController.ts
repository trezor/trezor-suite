import { useCallback, useMemo, useRef, useState } from 'react';

import { useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';

import { BottomSheetControlProps } from './useConfirmOnTrezorSheet';

export const useConfirmOnTrezorController = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const confirmOnTrezorRef = useRef<BottomSheetControlProps>(null);
    const { bottom } = useBannerAwareSafeAreaInsets();
    const { utils } = useNativeStyles();
    const currentHeaderHeight = confirmOnTrezorRef?.current?.currentHeaderHeight || 0;

    const revealConfirmOnTrezorSheet = useCallback(() => {
        confirmOnTrezorRef?.current?.revealConfirmOnTrezorSheet();
        setIsSheetOpen(true);
    }, []);

    const closeSheet = useCallback(() => {
        confirmOnTrezorRef?.current?.closeSheet();
        setIsSheetOpen(false);
    }, []);

    const defaultBottomInset = useMemo(
        () => (isSheetOpen ? currentHeaderHeight : 0) + bottom + utils.spacings.sp16,
        [isSheetOpen, currentHeaderHeight, bottom, utils.spacings.sp16],
    );

    return {
        revealConfirmOnTrezorSheet,
        confirmOnTrezorRef,
        isSheetOpen,
        closeSheet,
        currentHeaderHeight,
        defaultBottomInset,
    };
};
