import { useCallback, useRef, useState } from 'react';

import { type BottomSheetControlProps } from './useConfirmOnTrezorSheet';

export const useConfirmOnTrezorController = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const confirmOnTrezorRef = useRef<BottomSheetControlProps>(null);

    const revealConfirmOnTrezorSheet = useCallback(() => {
        confirmOnTrezorRef?.current?.revealConfirmOnTrezorSheet();
        setIsSheetOpen(true);
    }, []);

    const closeSheet = useCallback(() => {
        confirmOnTrezorRef?.current?.closeSheet();
        setIsSheetOpen(false);
    }, []);

    return {
        revealConfirmOnTrezorSheet,
        confirmOnTrezorRef,
        isSheetOpen,
        closeSheet,
        currentHeaderHeight: confirmOnTrezorRef?.current?.currentHeaderHeight,
    };
};
