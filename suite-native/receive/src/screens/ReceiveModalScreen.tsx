import { useSelector } from 'react-redux';

import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { G } from '@mobily/ts-belt';

import TrezorConnect from '@trezor/connect';
import { HStack, Text } from '@suite-native/atoms';
import {
    GoBackIcon,
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
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { selectEthereumAccountTokenSymbol } from '@suite-native/ethereum-tokens';
import { CryptoIcon } from '@suite-common/icons';

import { ReceiveAccount } from '../components/ReceiveAccount';

type ScreenSubHeaderContent = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
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

    const iconName = tokenContract ?? networkSymbol;
    const coinSymbol = (ethereumTokenSymbol ?? networkSymbol)?.toUpperCase();

    const handleGoBack = () => {
        navigation.goBack();
        // Cancel any hanging address states on device when leaving.
        TrezorConnect.cancel();
    };

    return (
        <ScreenSubHeader
            leftIcon={<GoBackIcon customGoBackFunction={handleGoBack} />}
            content={
                <>
                    <Text variant="highlight">
                        <Translation id="moduleReceive.screenTitle" values={{ coinSymbol }} />
                    </Text>
                    <HStack spacing="small" alignItems="center">
                        {iconName && <CryptoIcon symbol={iconName} size="extraSmall" />}
                        {accountLabel && <Text variant="highlight">{accountLabel}</Text>}
                    </HStack>
                </>
            }
        />
    );
};

export const ReceiveModalScreen = () => {
    const {
        params: { accountKey, tokenContract },
    } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();

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

    const isAccountSelected = G.isNotNullable(accountKey);

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
            {isAccountSelected ? (
                <ReceiveAccount accountKey={accountKey} tokenContract={tokenContract} />
            ) : (
                <AccountsList onSelectAccount={handleSelectAccount} />
            )}
        </Screen>
    );
};
