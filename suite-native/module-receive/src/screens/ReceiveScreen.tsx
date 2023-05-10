import React from 'react';

import { RouteProp, useRoute } from '@react-navigation/native';

import { ReceiveAccount } from '@suite-native/receive';
import {
    Screen,
    ScreenHeader,
    ReceiveStackParamList,
    ReceiveStackRoutes,
} from '@suite-native/navigation';

export const ReceiveScreen = () => {
    const route = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.Receive>>();
    const { accountKey, tokenContract } = route.params;

    return (
        <Screen header={<ScreenHeader content="Receive address" />}>
            <ReceiveAccount accountKey={accountKey} tokenContract={tokenContract} />
        </Screen>
    );
};
