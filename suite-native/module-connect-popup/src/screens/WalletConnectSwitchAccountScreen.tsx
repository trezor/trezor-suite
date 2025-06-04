import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectVisibleSortedDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
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
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

type NavigationProps = StackProps<RootStackParamList, RootStackRoutes.WalletConnectSwitchAccount>;

export const WalletConnectSwitchAccountScreen = ({ route }: NavigationProps) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { sessionTopic } = route.params;
    const sessions = useSelector(selectSessions);
    const session = sessions.find(s => s.topic === sessionTopic);
    const accounts = useSelector(selectVisibleSortedDeviceAccounts);
    const selectableAccounts = useMemo<Account[]>(
        () =>
            session
                ? getSessionNetworks(session)
                      .filter(network => network.status === 'active')
                      .flatMap(network =>
                          accounts.filter(account => account.symbol === network.symbol),
                      )
                : [],
        [accounts, session],
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
