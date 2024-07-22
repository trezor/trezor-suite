import styled from 'styled-components';
import { copyToClipboard } from '@trezor/dom-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button, Checkbox } from '@trezor/components';
import { DialogModal } from '../Modal/DialogRenderer';
import { AddressType } from '@suite-common/wallet-types';
import { spacings } from '@trezor/theme';
import { useState } from 'react';
import { setFlag } from 'src/actions/suite/suiteActions';

const StyledModal = styled(DialogModal)`
    width: 600px;
`;

const getAddressTypeText = (addressType: AddressType) => {
    switch (addressType) {
        case 'contract':
            return 'TR_COPY_ADDRESS_CONTRACT';
        case 'fingerprint':
            return 'TR_COPY_ADDRESS_FINGERPRINT';
        case 'policyId':
            return 'TR_COPY_ADDRESS_POLICY_ID';
    }
};

interface CopyAddressModalProps {
    address: string;
    onCancel: () => void;
    addressType: AddressType;
}

export const CopyAddressModal = ({ address, onCancel, addressType }: CopyAddressModalProps) => {
    const [checked, setChecked] = useState(false);

    const dispatch = useDispatch();

    const onCopyAddress = () => {
        if (checked) {
            dispatch(setFlag('showCopyAddressModal', false));
        }

        const result = copyToClipboard(address);
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
            iconVariant="warning"
            bodyHeading={<Translation id="TR_NOT_YOUR_RECEIVE_ADDRRESS" />}
            body={
                <>
                    <Translation id={getAddressTypeText(addressType)} />
                    <Checkbox
                        isChecked={checked}
                        onClick={() => setChecked(!checked)}
                        margin={{ top: spacings.md }}
                    >
                        <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                    </Checkbox>
                </>
            }
            bottomBarComponents={
                <>
                    <Button variant="warning" onClick={onCopyAddress}>
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                    <Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </>
            }
        />
    );
};
