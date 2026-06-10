import { useCallback, useEffect, useRef } from 'react';

import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';

import { type YieldReviewSigningResult } from '../types';
import { useYieldReviewAutoStart } from './useYieldReviewAutoStart';

type UseYieldReviewSheetAutoStartParams = {
    closeSheet: () => void;
    hasLeftReview: () => boolean;
    isSigned: boolean;
    leaveReviewFromDeviceCancel: () => Promise<void> | void;
    revealConfirmOnTrezorSheet: () => void;
    shouldAutoStartReview: boolean;
    startReview: () => Promise<YieldReviewSigningResult>;
};

export const useYieldReviewScreenControls = () => {
    const { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();
    const hasLeftReviewRef = useRef(false);

    const markReviewLeave = useCallback(() => {
        hasLeftReviewRef.current = true;
    }, []);

    const hasLeftReview = useCallback(() => hasLeftReviewRef.current, []);

    return {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    };
};

export const useYieldReviewSheetAutoStart = ({
    closeSheet,
    hasLeftReview,
    isSigned,
    leaveReviewFromDeviceCancel,
    revealConfirmOnTrezorSheet,
    shouldAutoStartReview,
    startReview,
}: UseYieldReviewSheetAutoStartParams) => {
    const handleReviewCancelled = useCallback(() => {
        if (hasLeftReview()) {
            return;
        }

        return leaveReviewFromDeviceCancel();
    }, [hasLeftReview, leaveReviewFromDeviceCancel]);

    useYieldReviewAutoStart({
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onReviewCancelled: handleReviewCancelled,
        onReviewFailed: closeSheet,
        shouldAutoStartReview,
        startReview,
    });

    useEffect(() => {
        if (isSigned) {
            closeSheet();
        }
    }, [closeSheet, isSigned]);
};
