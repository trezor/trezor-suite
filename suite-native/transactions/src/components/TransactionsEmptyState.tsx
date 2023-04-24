import React from 'react';
import { Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsStackParamList,
    AppTabsParamList,
    AppTabsRoutes,
    SendReceiveStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

const cardStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: utils.spacings.large,
    borderRadius: utils.borders.radii.large,
}));

const receiveButtonStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

type AccountDetailNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.AccountsStack,
    AccountsStackParamList
>;

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const { applyStyle } = useNativeStyles();

    const handleReceive = () => {
        navigation.navigate(AppTabsRoutes.SendReceiveStack, {
            screen: SendReceiveStackRoutes.Receive,
            params: { accountKey },
        });
    };

    return (
        <Box paddingHorizontal="medium">
            <Card style={applyStyle(cardStyle)}>
                <Box marginBottom="large" alignItems="center">
                    {/* eslint-disable-next-line global-require */}
                    <Image source={require('../assets/blockLayer.png')} />
                    <Text variant="titleSmall">No transactions...yet.</Text>
                    <Text variant="hint" color="textSubdued">
                        Get started by receiving transactions
                    </Text>
                </Box>
                <Box style={applyStyle(receiveButtonStyle)}>
                    <Button iconLeft="receive" onPress={handleReceive}>
                        Receive
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};
