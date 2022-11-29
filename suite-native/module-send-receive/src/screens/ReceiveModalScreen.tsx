import React, { ReactNode, useEffect, useState } from 'react';

import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation/libDev/src';

import { AccountSelectionStep } from '../components/AccountSelectionStep';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { AddressGenerationStep } from '../components/AddressGenerationStep';
import { AddressConfirmationStep } from '../components/AddressConfirmationStep';
import { FreshAddressStep } from '../components/FreshAddressStep';

const DEFAULT_CONTENT_TYPE = sendReceiveContentType.selectAccountToReceive;

export const ReceiveModalScreen = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.SendReceive>) => {
    const [selectedAccountKey, setSelectedAccountKey] = useState<string>(
        route.params.accountKey || '',
    );
    const [contentType, setContentType] = useState<SendReceiveContentType>(DEFAULT_CONTENT_TYPE);

    useEffect(() => {
        if (route.params.accountKey) {
            setContentType(sendReceiveContentType.createNewAddressToReceive);
        }
    }, [route.params.accountKey]);

    const handleChangeContentType = (type: SendReceiveContentType) => {
        setContentType(type);
    };

    const handleSelectAccount = (key: string) => {
        setSelectedAccountKey(key);
    };

    const handleClose = () => {
        navigation.goBack();
        setSelectedAccountKey('');
        setContentType(DEFAULT_CONTENT_TYPE);
    };

    const sendReceiveContent: Record<SendReceiveContentType, ReactNode> = {
        [sendReceiveContentType.selectAccountToReceive]: (
            <AccountSelectionStep
                onChangeContentType={handleChangeContentType}
                onSelectAccount={handleSelectAccount}
            />
        ),
        [sendReceiveContentType.createNewAddressToReceive]: (
            <AddressGenerationStep
                accountKey={selectedAccountKey}
                onChangeContentType={handleChangeContentType}
            />
        ),
        [sendReceiveContentType.confirmNewAddressToReceive]: (
            <AddressConfirmationStep
                accountKey={selectedAccountKey}
                onChangeContentType={handleChangeContentType}
            />
        ),
        [sendReceiveContentType.generatedAddressToReceive]: (
            <FreshAddressStep accountKey={selectedAccountKey} onClose={handleClose} />
        ),
    };

    return (
        <Screen header={<ScreenHeader title="Receive" />}>{sendReceiveContent[contentType]}</Screen>
    );
};
