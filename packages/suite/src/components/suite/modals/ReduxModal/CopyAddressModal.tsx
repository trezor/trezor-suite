import { useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import {
    type AppCopyToClipboardFrom,
    COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE,
} from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type AddressType } from '@suite-common/wallet-types';
import { Card, Checkbox, H2, Modal, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import { WarningIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

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
    copyAnalyticsFrom?: AppCopyToClipboardFrom;
}

export const CopyAddressModal = ({
    address,
    onCancel,
    addressType,
    copyAnalyticsFrom,
}: CopyAddressModalProps) => {
    const [checked, setChecked] = useState(false);

    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const onCopyAddress = async () => {
        if (checked) {
            dispatch(setFlag({ key: 'showCopyAddressModal', value: false }));
        }

        const result = await copyToClipboard(address);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
        if (copyAnalyticsFrom !== undefined) {
            analytics.report({
                type: events.appCopyToClipboardEvent.name,
                payload: {
                    from: copyAnalyticsFrom,
                    type: COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE[addressType],
                },
            });
        }
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            icon={WarningIcon}
            intent="warning"
            bottomContent={
                <>
                    <Modal.Button onClick={onCopyAddress}>
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_NOT_YOUR_RECEIVE_ADDRRESS" />
            </H2>
            <Paragraph intent="neutral" priority="secondary" margin={{ top: 8 }}>
                <Translation id={getAddressTypeText(addressType)} />
            </Paragraph>
            <Card margin={{ top: 24 }}>
                <Checkbox isChecked={checked} onChange={() => setChecked(!checked)}>
                    <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                </Checkbox>
            </Card>
        </Modal>
    );
};
