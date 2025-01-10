import { Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { AccountsList, OnSelectAccount } from '@suite-native/accounts';
import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccountScreen } from './ReceiveAccountScreen';
import { ReceiveScreenHeader } from '../components/ReceiveScreenHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp8,
}));

const LoadingReceiveAccount = () => {
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

export const ReceiveModalScreen = () => {
    const {
        params: {
            accountKey: routeAccountKey,
            tokenContract,
            networkSymbol: routeNetworkSymbol,
            accountType: routeAccountType,
            accountIndex: routeAccountIndex,
        },
    } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const foundAccountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
            state,
            routeNetworkSymbol,
            routeAccountType,
            routeAccountIndex,
        ),
    );

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const accountKey = routeAccountKey ?? foundAccountKey;

    const handleSelectAccount: OnSelectAccount = ({
        account,
        tokenAddress: selectedTokenContract,
    }) => {
        navigation.dispatch({
            ...CommonActions.setParams({
                accountKey: account.key,
                tokenContract: selectedTokenContract,
            }),
        });
    };

    const isLoading =
        !accountKey && (routeNetworkSymbol !== undefined || routeAccountType !== undefined);
    const isSelecting = !isLoading && !accountKey;

    if (accountKey) {
        return <ReceiveAccountScreen accountKey={accountKey} tokenContract={tokenContract} />;
    }

    return (
        <Screen
            hasBottomInset={false}
            screenHeader={
                <ReceiveScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            {isLoading && <LoadingReceiveAccount />}
            {isSelecting && <AccountsList onSelectAccount={handleSelectAccount} />}
        </Screen>
    );
};
