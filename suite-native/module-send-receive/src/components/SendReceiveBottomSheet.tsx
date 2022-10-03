import { BottomSheet } from '@suite-native/atoms';
import { ActionButtons } from './ActionButtons';
import { AccountsList } from './AccountsList';
import React, { useState } from 'react';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { AddressGeneration } from './AddressGeneration';
import { AddressConfirmation } from './AddressConfirmation';
import { FreshAddress } from './FreshAddress';

type SendReceiveBottomSheetProps = {
    isVisible: boolean;
    onVisibilityChange: (visible: boolean) => void;
};

const DEFAULT_CONTENT_TYPE = sendReceiveContentType.chooseAction;

export const SendReceiveBottomSheet = ({
    isVisible,
    onVisibilityChange,
}: SendReceiveBottomSheetProps) => {
    const [contentType, setContentType] = useState<SendReceiveContentType>(DEFAULT_CONTENT_TYPE);

    const handleChangeContentType = (type: SendReceiveContentType) => {
        setContentType(type);
    };

    const handleClose = () => {
        onVisibilityChange(false);
        setContentType(DEFAULT_CONTENT_TYPE);
    };

    const getSendReceiveContentTitle = () => {
        switch (contentType) {
            case sendReceiveContentType.selectAccountToReceive:
            case sendReceiveContentType.createNewAddressToReceive:
            case sendReceiveContentType.confirmNewAddressToReceive:
            case sendReceiveContentType.generatedAddressToReceive: {
                return 'Receive';
            }
            case sendReceiveContentType.selectAccountToSend: {
                return 'Send';
            }
            default:
        }
    };

    const getSendReceiveContentComponent = () => {
        switch (contentType) {
            case sendReceiveContentType.chooseAction: {
                return <ActionButtons onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.selectAccountToReceive: {
                return <AccountsList onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.createNewAddressToReceive: {
                return <AddressGeneration onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.confirmNewAddressToReceive: {
                return <AddressConfirmation onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.generatedAddressToReceive: {
                return <FreshAddress address="TODO" onClose={handleClose} />;
            }
            default:
        }
    };

    return (
        <BottomSheet
            isVisible={isVisible}
            onVisibilityChange={handleClose}
            title={getSendReceiveContentTitle()}
        >
            {getSendReceiveContentComponent()}
        </BottomSheet>
    );
};
