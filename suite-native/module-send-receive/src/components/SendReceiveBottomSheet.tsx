import React, { ReactNode, useState } from 'react';

import { BottomSheet } from '@suite-native/atoms';

import { AccountActionStep } from './AccountActionStep';
import { AccountSelectionStep } from './AccountSelectionStep';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { AddressGenerationStep } from './AddressGenerationStep';
import { AddressConfirmationStep } from './AddressConfirmationStep';
import { FreshAddressStep } from './FreshAddressStep';

type SendReceiveBottomSheetProps = {
    isVisible: boolean;
    onVisibilityChange: (visible: boolean) => void;
};

const DEFAULT_CONTENT_TYPE = sendReceiveContentType.chooseAction;

export const SendReceiveBottomSheet = ({
    isVisible,
    onVisibilityChange,
}: SendReceiveBottomSheetProps) => {
    const [selectedAccountKey, setSelectedAccountKey] = useState<string>('');
    const [contentType, setContentType] = useState<SendReceiveContentType>(DEFAULT_CONTENT_TYPE);

    const handleChangeContentType = (type: SendReceiveContentType) => {
        setContentType(type);
    };

    const handleSelectAccount = (accountKey: string) => {
        setSelectedAccountKey(accountKey);
    };

    const handleClose = () => {
        onVisibilityChange(false);
        setSelectedAccountKey('');
        setContentType(DEFAULT_CONTENT_TYPE);
    };

    const sendReceiveContent: Record<
        SendReceiveContentType,
        { title?: string; component: ReactNode }
    > = {
        [sendReceiveContentType.chooseAction]: {
            component: <AccountActionStep onChangeContentType={handleChangeContentType} />,
        },
        [sendReceiveContentType.selectAccountToReceive]: {
            title: 'Receive',
            component: (
                <AccountSelectionStep
                    onChangeContentType={handleChangeContentType}
                    onSelectAccount={handleSelectAccount}
                />
            ),
        },
        [sendReceiveContentType.createNewAddressToReceive]: {
            title: 'Receive',
            component: (
                <AddressGenerationStep
                    accountKey={selectedAccountKey}
                    onChangeContentType={handleChangeContentType}
                />
            ),
        },
        [sendReceiveContentType.confirmNewAddressToReceive]: {
            title: 'Receive',
            component: (
                <AddressConfirmationStep
                    accountKey={selectedAccountKey}
                    onChangeContentType={handleChangeContentType}
                />
            ),
        },
        [sendReceiveContentType.generatedAddressToReceive]: {
            title: 'Receive',
            component: <FreshAddressStep accountKey={selectedAccountKey} onClose={handleClose} />,
        },
    };

    return (
        <BottomSheet
            isVisible={isVisible}
            onVisibilityChange={handleClose}
            title={sendReceiveContent[contentType].title}
        >
            {sendReceiveContent[contentType].component}
        </BottomSheet>
    );
};
