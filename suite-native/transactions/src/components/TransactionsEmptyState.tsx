import React from 'react';
import { Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { RootStackRoutes } from '@suite-native/navigation';

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

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation = useNavigation();
    const { applyStyle } = useNativeStyles();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.SendReceive, { accountKey });
    };

    return (
        <Box paddingHorizontal="medium">
            <Card style={applyStyle(cardStyle)}>
                <Box marginBottom="large" alignItems="center">
                    {/* eslint-disable-next-line global-require */}
                    <Image source={require('../assets/blockLayer.png')} />
                    <Text variant="titleSmall">No transactions...yet.</Text>
                    <Text variant="hint" color="gray600">
                        Get started by receiving transactions
                    </Text>
                </Box>
                <Button
                    style={applyStyle(receiveButtonStyle)}
                    iconName="receive"
                    onPress={handleReceive}
                >
                    Receive
                </Button>
            </Card>
        </Box>
    );
};
