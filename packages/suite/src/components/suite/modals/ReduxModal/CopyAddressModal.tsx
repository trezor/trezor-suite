import { useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { AddressType } from '@suite-common/wallet-types';
import { Card, Checkbox, H2, Modal, Paragraph } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings } from '@trezor/theme';

import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';

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
        <Modal
            onCancel={onCancel}
            iconName="warning"
            variant="warning"
            bottomContent={
                <>
                    <Modal.Button onClick={onCopyAddress}>
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_NOT_YOUR_RECEIVE_ADDRRESS" />
            </H2>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id={getAddressTypeText(addressType)} />
            </Paragraph>
            <Card margin={{ top: spacings.xl }}>
                <Checkbox isChecked={checked} onClick={() => setChecked(!checked)}>
                    <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
