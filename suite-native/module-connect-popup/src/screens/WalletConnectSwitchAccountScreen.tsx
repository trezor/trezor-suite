import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getSessionNetworks,
    selectSessions,
    switchSelectedAccountThunk,
    walletConnectActions,
} from '@suite-common/walletconnect';
import { AccountsListItem } from '@suite-native/accounts';
import { Card, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

type NavigationProps = StackProps<RootStackParamList, RootStackRoutes.WalletConnectSwitchAccount>;

export const WalletConnectSwitchAccountScreen = ({ route }: NavigationProps) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { sessionTopic } = route.params;
    const sessions = useSelector(selectSessions);
    const session = sessions.find(s => s.topic === sessionTopic);
    const accounts = useSelector(state => selectAllAccountsToList(state, networkConfigDeps));
    const selectableAccounts = useMemo<Account[]>(
        () =>
            session
                ? getSessionNetworks(networkConfigDeps, session)
                      .filter(network => network.status === 'active')
                      .flatMap(network =>
                          accounts.filter(account => account.symbol === network.symbol),
                      )
                : [],
        [accounts, networkConfigDeps, session],
    );

    const handleSave = (account: Account) => {
        if (session) {
            dispatch(switchSelectedAccountThunk({ account, sessionTopic }));
            dispatch(
                walletConnectActions.saveSession({
                    ...session,
                    lastAccount: account,
                }),
            );
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp24">
                <TitleHeader
                    title={<Translation id="moduleConnectPopup.walletConnect.switchAccount" />}
                />

                <Card noPadding>
                    {selectableAccounts.map(account => (
                        <AccountsListItem
                            key={account.key}
                            account={account}
                            onPress={() => handleSave(account)}
                        />
                    ))}
                </Card>
            </VStack>
        </Screen>
    );
};
