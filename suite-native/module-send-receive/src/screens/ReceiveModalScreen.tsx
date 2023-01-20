import React, { ReactNode, useCallback, useMemo, useState } from 'react';

import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { AddressGenerationStep } from '../components/AddressGenerationStep';
import { AddressConfirmationStep } from '../components/AddressConfirmationStep';
import { FreshAddressStep } from '../components/FreshAddressStep';

const DEFAULT_CONTENT_TYPE = sendReceiveContentType.createNewAddressToReceive;

export const ReceiveModalScreen = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.ReceiveModal>) => {
    const [selectedAccountKey, setSelectedAccountKey] = useState<string>(route.params.accountKey);
    const [contentType, setContentType] = useState<SendReceiveContentType>(DEFAULT_CONTENT_TYPE);

    const handleClose = useCallback(() => {
        navigation.goBack();
        setSelectedAccountKey('');
        setContentType(DEFAULT_CONTENT_TYPE);
    }, [navigation]);

    const sendReceiveContent: Record<SendReceiveContentType, ReactNode> = useMemo(
        () => ({
            [sendReceiveContentType.createNewAddressToReceive]: (
                <AddressGenerationStep
                    accountKey={selectedAccountKey}
                    onChangeContentType={setContentType}
                />
            ),
            [sendReceiveContentType.confirmNewAddressToReceive]: (
                <AddressConfirmationStep
                    accountKey={selectedAccountKey}
                    onChangeContentType={setContentType}
                />
            ),
            [sendReceiveContentType.generatedAddressToReceive]: (
                <FreshAddressStep accountKey={selectedAccountKey} onClose={handleClose} />
            ),
        }),
        [handleClose, selectedAccountKey],
    );

    return (
        <Screen header={<ScreenHeader title="Receive" />}>{sendReceiveContent[contentType]}</Screen>
    );
};
