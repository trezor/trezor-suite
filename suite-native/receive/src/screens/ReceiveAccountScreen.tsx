import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';
import { ReceiveStackParamList, ReceiveStackRoutes, Screen } from '@suite-native/navigation';
import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAddressScreen } from './ReceiveAddressScreen';
import { ReceiveScreenHeader } from '../components/ReceiveScreenHeader';

const SCREEN_WIDTH = getScreenWidth();

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp8,
}));

const ReceiveAccountLoader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp32" alignItems="center" paddingHorizontal="sp8">
            <Card style={applyStyle(cardStyle)}>
                <BoxSkeleton width={SCREEN_WIDTH - 32} height={70} />
            </Card>
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing="sp24" alignItems="center" paddingHorizontal="sp24">
                    <BoxSkeleton width={SCREEN_WIDTH - 80} height={200} />
                    <BoxSkeleton width={SCREEN_WIDTH - 80} height={48} borderRadius={24} />
                </VStack>
            </Card>
        </VStack>
    );
};

export const ReceiveAccountScreen = () => {
    const {
        params: {
            accountKey: routeAccountKey,
            tokenContract,
            networkSymbol: routeNetworkSymbol,
            accountType: routeAccountType,
            accountIndex: routeAccountIndex,
            closeActionType,
        },
    } = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccount>>();

    const foundAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
            state,
            routeNetworkSymbol,
            routeAccountType,
            routeAccountIndex,
        ),
    );

    const accountKey = routeAccountKey ?? foundAccountKey;

    if (accountKey) {
        return (
            <ReceiveAddressScreen
                accountKey={accountKey}
                tokenContract={tokenContract}
                closeActionType={closeActionType}
            />
        );
    }

    return (
        <Screen
            header={
                <ReceiveScreenHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            }
        >
            <ReceiveAccountLoader />
        </Screen>
    );
};
