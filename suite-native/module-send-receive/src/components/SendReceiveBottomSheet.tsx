import { BottomSheet } from '@suite-native/atoms';
import { ChooseActionButtons } from './ChooseActionButtons';
import { SelectAccount } from './SelectAccount';
import React, { useState } from 'react';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

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
            case sendReceiveContentType.selectAccountToReceive: {
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
            case sendReceiveContentType.selectAccountToReceive: {
                return <SelectAccount />;
            }
            case sendReceiveContentType.selectAccountToSend: {
                return <SelectAccount />;
            }
            default:
                return <ChooseActionButtons onChangeContent={handleChangeContentType} />;
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
