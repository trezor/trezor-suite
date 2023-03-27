import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { Box, ErrorMessage, Text, VStack } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    Screen,
    ScreenHeader,
    SendReceiveStackParamList,
    SendReceiveStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { ReceiveAddress } from '../components/ReceiveAddress';
import { ReceiveTextHint } from '../components/ReceiveTextHint';

export const ReceiveScreen = ({
    route,
    navigation,
}: StackProps<SendReceiveStackParamList, SendReceiveStackRoutes.Receive>) => {
    const [addressIsVisible, setAddressIsVisible] = useState(false);
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return <ErrorMessage errorMessage={`Account ${accountKey} not found.`} />;

    return (
        <Screen header={<ScreenHeader title="Receive address" />}>
            <VStack spacing="medium">
                <AccountListItem account={account} />
                <Box marginLeft="small">
                    <Text variant="hint" color="textSubdued">
                        Address
                    </Text>
                </Box>

                {addressIsVisible ? (
                    <ReceiveAddress
                        accountKey={accountKey}
                        onClose={navigation.goBack}
                        backgroundElevation="1"
                    />
                ) : (
                    <ReceiveTextHint onShowAddress={() => setAddressIsVisible(true)} />
                )}
            </VStack>
        </Screen>
    );
};
