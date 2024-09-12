import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';
import { COINMARKET_BUY } from 'src/actions/wallet/constants';
import { Dispatch } from 'src/types/suite';

interface ConfirmUnverifiedProceedModalProps {
    value: string;
}

export const ConfirmUnverifiedProceedModal = ({ value }: ConfirmUnverifiedProceedModalProps) => {
    const proceedWithUnverifiedAddress = () => (dispatch: Dispatch) => {
        dispatch({
            type: COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: value,
        });
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
