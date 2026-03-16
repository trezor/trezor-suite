import { tradingActions } from '@suite-common/trading';

import { type Dispatch } from 'src/types/suite';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

interface ConfirmUnverifiedProceedModalProps {
    value: string;
}

export const ConfirmUnverifiedProceedModal = ({ value }: ConfirmUnverifiedProceedModalProps) => {
    const proceedWithUnverifiedAddress = () => (dispatch: Dispatch) => {
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
