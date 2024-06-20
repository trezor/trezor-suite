import styled from 'styled-components';
import { copyToClipboard } from '@trezor/dom-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button } from '@trezor/components';
import { DialogModal } from '../Modal/DialogRenderer';

const StyledModal = styled(DialogModal)`
    width: 600px;
`;

interface CopyContractAddressModalProps {
    contract: string;
    onCancel: () => void;
}

export const CopyContractAddressModal = ({ contract, onCancel }: CopyContractAddressModalProps) => {
    const dispatch = useDispatch();

    const onCopyContractAddress = () => {
        const result = copyToClipboard(contract);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
        onCancel();
    };

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            icon="warningTriangleLight"
            bodyHeading={<Translation id="TR_NOT_YOUR_RECEIVE_ADDRRESS" />}
            text={<Translation id="TR_COPY_CONTRACT_ADDRESS" />}
            bottomBarComponents={
                <>
                    <Button variant="destructive" onClick={onCopyContractAddress}>
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                    <Button variant="primary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </>
            }
        />
    );
};
