import { useCallback, useRef, useState } from 'react';

import { BottomSheetControlProps } from './useConfirmOnTrezorSheet';

export const useConfirmOnTrezorController = () => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const confirmOnTrezorRef = useRef<BottomSheetControlProps>(null);

    const triggerTransition = useCallback(() => {
        confirmOnTrezorRef?.current?.triggerTransition();
        setIsSheetOpen(true);
    }, []);

    const closeSheet = useCallback(() => {
        confirmOnTrezorRef?.current?.closeSheet();
        setIsSheetOpen(false);
    }, []);

    return { triggerTransition, confirmOnTrezorRef, isSheetOpen, closeSheet };
};
