import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core/';

import { hasReceiveAddressButtonRequest } from './receiveSelectors';

export enum ReceiveProgressStep {
    ObfuscatedAddress,
    LoadingOnTrezor,
    ShownUncheckedAddress,
    ShownPortfolioAddress,
    ApprovedOnTrezor,
}

export const useReceiveProgressSteps = ({
    isUnverifiedAddressRevealed,
    isReceiveApproved,
}: {
    isUnverifiedAddressRevealed: boolean;
    isReceiveApproved: boolean;
}) => {
    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);
    const hasReceivedButtonRequest = useSelector(hasReceiveAddressButtonRequest);
    const [receiveProgressStep, setReceiveProgressStep] = useState<ReceiveProgressStep>(
        ReceiveProgressStep.ObfuscatedAddress,
    );
    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceivedButtonRequest;

    useEffect(() => {
        if (isPortfolioTracker) {
            if (isReceiveApproved) {
                setReceiveProgressStep(ReceiveProgressStep.ShownPortfolioAddress);
            } else {
                setReceiveProgressStep(ReceiveProgressStep.ObfuscatedAddress);
            }
        } else if (!isUnverifiedAddressRevealed) {
            setReceiveProgressStep(ReceiveProgressStep.ObfuscatedAddress);
        } else if (isUnverifiedAddressRevealed && !isReceiveApproved) {
            if (hasReceivedButtonRequest) {
                setReceiveProgressStep(ReceiveProgressStep.ShownUncheckedAddress);
            } else {
                setReceiveProgressStep(ReceiveProgressStep.LoadingOnTrezor);
            }
        } else if (isUnverifiedAddressRevealed && isReceiveApproved) {
            setReceiveProgressStep(ReceiveProgressStep.ApprovedOnTrezor);
        }
    }, [
        isUnverifiedAddressRevealed,
        isReceiveApproved,
        hasReceivedButtonRequest,
        isPortfolioTracker,
        receiveProgressStep,
    ]);
    return { receiveProgressStep, isConfirmOnTrezorReady };
};

export const isAddressRevealed = (step: ReceiveProgressStep) =>
    [
        ReceiveProgressStep.ApprovedOnTrezor,
        ReceiveProgressStep.ShownUncheckedAddress,
        ReceiveProgressStep.ShownPortfolioAddress,
    ].includes(step);
