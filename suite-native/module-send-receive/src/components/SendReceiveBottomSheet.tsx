import { BottomSheet } from '@suite-native/atoms';
import { ChooseActionButtons } from './ChooseActionButtons';
import { SelectAccount } from './SelectAccount';
import React, { useState } from 'react';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { CreateAddress } from './CreateAddress';
import { ConfirmAddress } from './ConfirmAddress';
import { GeneratedAddress } from './GeneratedAddress';

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
                return <ChooseActionButtons onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.selectAccountToReceive: {
                return <SelectAccount onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.createNewAddressToReceive: {
                return <CreateAddress onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.confirmNewAddressToReceive: {
                return <ConfirmAddress onChangeContent={handleChangeContentType} />;
            }
            case sendReceiveContentType.generatedAddressToReceive: {
                return <GeneratedAddress onClose={handleClose} />;
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
