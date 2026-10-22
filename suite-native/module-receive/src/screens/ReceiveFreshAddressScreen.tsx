import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type DeviceRootState } from '@suite-common/device';
import {
    type AccountsRootState,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { type ReceiveStackParamList, type ReceiveStackRoutes } from '@suite-native/navigation';
import { ScreenPerformanceRoot, useIsReceiveScreenReady } from '@suite-native/performance-metrics';

import { ReceiveAddressContent } from '../components/ReceiveAddressContent';
import { ReceiveAddressLoader } from '../components/ReceiveAddressLoader';

export const ReceiveFreshAddressScreen = () => {
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
    const isScreenReady = useIsReceiveScreenReady(accountKey);

    return (
        <ScreenPerformanceRoot screen="receive" isReady={isScreenReady}>
            {accountKey ? (
                <ReceiveAddressContent
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            ) : (
                <ReceiveAddressLoader
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            )}
        </ScreenPerformanceRoot>
    );
};
