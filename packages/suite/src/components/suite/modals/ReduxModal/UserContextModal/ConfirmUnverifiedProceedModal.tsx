import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { tradingActions } from '@suite-common/trading';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

interface ConfirmUnverifiedProceedModalProps {
    value: string;
}

export const ConfirmUnverifiedProceedModal = ({ value }: ConfirmUnverifiedProceedModalProps) => {
    const proceedWithUnverifiedAddress = () => (dispatch: Dispatch<UnknownAction>) => {
        dispatch(
            tradingActions.setVerifiedAddress({
                address: value,
            }),
        );
    };

    return (
        <ConfirmUnverifiedModal
            action={{
                event: proceedWithUnverifiedAddress,
                title: 'TR_PROCEED_UNVERIFIED_ADDRESS',
                closeAfterEventTriggered: true,
            }}
            warningText="TR_ADDRESS_PHISHING_WARNING"
        />
    );
};
