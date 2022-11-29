import React, { ReactNode, useState } from 'react';

import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { AccountActionStep } from './AccountActionStep';
import { AccountSelectionStep } from './AccountSelectionStep';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';
import { AddressGenerationStep } from './AddressGenerationStep';
import { AddressConfirmationStep } from './AddressConfirmationStep';
import { FreshAddressStep } from './FreshAddressStep';

const DEFAULT_CONTENT_TYPE = sendReceiveContentType.chooseAction;

export const SendReceiveBottomSheet = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.SendReceive>) => {
    const [selectedAccountKey, setSelectedAccountKey] = useState<string>('');
    const [contentType, setContentType] = useState<SendReceiveContentType>(DEFAULT_CONTENT_TYPE);

    console.log(route.params.accountKey);

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

    return <Screen header={<ScreenHeader />}>{sendReceiveContent[contentType].component}</Screen>;
};
