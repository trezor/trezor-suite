import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type DeviceRootState } from '@suite-common/device';
import {
    type AccountsRootState,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { type ReceiveStackParamList, type ReceiveStackRoutes } from '@suite-native/navigation';

import { ReceiveAddressContent } from '../components/ReceiveAddressContent';
import { ReceiveAddressLoader } from '../components/ReceiveAddressLoader';

export const ReceiveAddressScreen = () => {
    const {
        params: {
            accountKey: routeAccountKey,
            tokenContract,
            networkSymbol: routeNetworkSymbol,
            accountType: routeAccountType,
            accountIndex: routeAccountIndex,
            closeActionType,
        },
    } = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAddress>>();

    const foundAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
            state,
            routeNetworkSymbol,
            routeAccountType,
            routeAccountIndex,
        ),
    );
    const accountKey = routeAccountKey ?? foundAccountKey;

    if (!accountKey) {
        return (
            <ReceiveAddressLoader tokenContract={tokenContract} closeActionType={closeActionType} />
        );
    }

    return (
        <ReceiveAddressContent
            accountKey={accountKey}
            tokenContract={tokenContract}
            closeActionType={closeActionType}
        />
    );
};
