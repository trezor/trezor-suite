import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { Dimensions } from 'react-native';

import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import { BoxSkeleton, Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { AccountsList } from '@suite-native/accounts';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import {
    AccountsRootState,
    DeviceRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
    selectDeviceAccountsForNetworkSymbolAndAccountTypeWithIndex,
} from '@suite-common/wallet-core';
import { selectEthereumAccountTokenSymbol } from '@suite-native/ethereum-tokens';
import { CryptoIcon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAccount } from '../components/ReceiveAccount';

const SCREEN_WIDTH = Dimensions.get('window').width;

type ScreenSubHeaderContent = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
};

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.small,
}));

const LoadingReceiveAccount = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="extraLarge" alignItems="center" paddingHorizontal="small">
            <Card style={applyStyle(cardStyle)}>
                <BoxSkeleton width={SCREEN_WIDTH - 32} height={70} />
            </Card>
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing="large" alignItems="center" paddingHorizontal="large">
                    <BoxSkeleton width={SCREEN_WIDTH - 80} height={200} />
                    <BoxSkeleton width={SCREEN_WIDTH - 80} height={48} borderRadius={24} />
                </VStack>
            </Card>
        </VStack>
    );
};

const ReceiveModalScreenSubHeader = ({ accountKey, tokenContract }: ScreenSubHeaderContent) => {
    const navigation = useNavigation();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const ethereumTokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, tokenContract),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            // When leaving the screen, cancel the request for address on trezor device
            TrezorConnect.cancel();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <ScreenSubHeader
            content={
                <>
                    <Text variant="highlight">
                        <Translation
                            id="moduleReceive.screenTitle"
                            values={{ coinSymbol: networkSymbol?.toUpperCase() }}
                        />
                    </Text>
                    <HStack spacing="small" alignItems="center">
                        {networkSymbol && <CryptoIcon symbol={networkSymbol} size="extraSmall" />}
                        {accountLabel && (
                            <Text variant="highlight">
                                {accountLabel}
                                {ethereumTokenSymbol && ` - ${ethereumTokenSymbol}`}
                            </Text>
                        )}
                    </HStack>
                </>
            }
        />
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
        selectDeviceAccountsForNetworkSymbolAndAccountTypeWithIndex(
            state,
            routeNetworkSymbol,
            routeAccountType,
            routeAccountIndex,
        ),
    )?.key;

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const accountKey = routeAccountKey ?? foundAccountKey;

    const handleSelectAccount = (
        selectedAccountKey: AccountKey,
        selectedTokenContract?: TokenAddress,
    ) => {
        navigation.dispatch({
            ...CommonActions.setParams({
                accountKey: selectedAccountKey,
                tokenContract: selectedTokenContract,
            }),
        });
    };

    const isLoading =
        !accountKey && (routeNetworkSymbol !== undefined || routeAccountType !== undefined);
    const isSelecting = !isLoading && !accountKey;

    return (
        <Screen
            hasBottomInset={false}
            screenHeader={
                <ReceiveModalScreenSubHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                />
            }
        >
            {accountKey && <ReceiveAccount accountKey={accountKey} tokenContract={tokenContract} />}
            {isLoading && <LoadingReceiveAccount />}
            {isSelecting && <AccountsList onSelectAccount={handleSelectAccount} />}
        </Screen>
    );
};
