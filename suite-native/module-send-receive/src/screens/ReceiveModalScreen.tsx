import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { Box, Card, ErrorMessage, Text, VStack } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { ReceiveAddress } from '../components/ReceiveAddress';
import { ReceiveTextHint } from '../components/ReceiveTextHint';

export const ReceiveModalScreen = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.ReceiveModal>) => {
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
                <Card>
                    {addressIsVisible ? (
                        <ReceiveAddress accountKey={accountKey} onClose={navigation.goBack} />
                    ) : (
                        <ReceiveTextHint onShowAddress={() => setAddressIsVisible(true)} />
                    )}
                </Card>
            </VStack>
        </Screen>
    );
};
