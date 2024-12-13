import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A, pipe } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';
import { CommonActions, useNavigation } from '@react-navigation/native';

import {
    type AccountType,
    type NetworkSymbol,
    networks,
    NORMAL_ACCOUNT_TYPE,
    networkSymbolCollection,
    getNetwork,
} from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    LIMIT,
    selectSelectedDevice,
    selectDeviceAccounts,
    selectIsDeviceInViewOnlyMode,
    accountsActions,
} from '@suite-common/wallet-core';
import {
    addAndDiscoverNetworkAccountThunk,
    selectDeviceEnabledDiscoveryNetworkSymbols,
    selectDiscoveryNetworkSymbols,
} from '@suite-native/discovery';
import { TxKeyPath, useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    AddCoinAccountStackRoutes,
    AddCoinAccountStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackRoutes,
    AddCoinFlowType,
    AppTabsRoutes,
} from '@suite-native/navigation';
import { useAccountAlerts } from '@suite-native/accounts';

import { useAddCoinAccountAlerts } from './useAddCoinAccountAlerts';

export type AddCoinAccountNavigationProps = StackToStackCompositeNavigationProps<
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes.AddCoinAccount,
    RootStackParamList
>;

export const accountTypeTranslationKeys: Record<
    Exclude<AccountType, 'coinjoin' | 'imported' | 'ledger'>,
    { titleKey: TxKeyPath; subtitleKey: TxKeyPath; descKey: TxKeyPath }
> = {
    normal: {
        titleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.normal.title',
        subtitleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.normal.subtitle',
        descKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.normal.desc',
    },
    taproot: {
        titleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.taproot.title',
        subtitleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.taproot.subtitle',
        descKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.taproot.desc',
    },
    segwit: {
        titleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.segwit.title',
        subtitleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.segwit.subtitle',
        descKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.segwit.desc',
    },
    legacy: {
        titleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.legacy.title',
        subtitleKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.legacy.subtitle',
        descKey: 'moduleAddAccounts.selectAccountTypeScreen.accountTypes.legacy.desc',
    },
};

export const useAddCoinAccount = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const supportedNetworkSymbols = useSelector(selectDiscoveryNetworkSymbols);
    const deviceAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccounts(state),
    );
    const device = useSelector(selectSelectedDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const enabledDiscoveryNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);

    const navigation = useNavigation<AddCoinAccountNavigationProps>();

    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const {
        showTooManyAccountsAlert,
        showAnotherEmptyAccountAlert,
        showGeneralErrorAlert,
        showPassphraseAuthAlert,
    } = useAddCoinAccountAlerts();

    const [networkSymbolWithTypeToBeAdded, setNetworkSymbolWithTypeToBeAdded] = useState<
        [NetworkSymbol, AccountType] | null
    >(null);

    const availableNetworkAccountTypes = useMemo(() => {
        // first account type for every network is set to normal and represents default type
        const availableTypes: Map<NetworkSymbol, [AccountType, ...AccountType[]]> = new Map();

        networkSymbolCollection.forEach(symbol => {
            // for Cardano and Ethereum only allow latest account type and coinjoin and ledger are not supported
            const types = Object.keys(networks[symbol].accountTypes).filter(
                t => !['coinjoin', 'imported', 'ledger'].includes(t),
            ) as AccountType[];

            availableTypes.set(symbol, [
                NORMAL_ACCOUNT_TYPE,
                // For Cardano and EVMs allow only normal account type
                ...(['ada', 'eth', 'pol', 'bnb', 'sol', 'op', 'base'].includes(symbol)
                    ? []
                    : types),
            ]);
        });

        return availableTypes;
    }, []);

    const getAvailableAccountTypesForNetworkSymbol = ({ symbol }: { symbol: NetworkSymbol }) =>
        availableNetworkAccountTypes.get(symbol) ?? [NORMAL_ACCOUNT_TYPE];

    const getAccountTypeToBeAddedName = () =>
        networkSymbolWithTypeToBeAdded
            ? translate(accountTypeTranslationKeys[networkSymbolWithTypeToBeAdded[1]].titleKey)
            : '';

    const setDefaultAccountToBeAdded = (symbol: NetworkSymbol) => {
        const defaultType = getAvailableAccountTypesForNetworkSymbol({ symbol })[0];
        setNetworkSymbolWithTypeToBeAdded([symbol, defaultType]);
    };

    const navigateToSuccessorScreen = ({
        flowType,
        symbol,
        accountType,
        accountIndex,
    }: {
        flowType: AddCoinFlowType;
        symbol: NetworkSymbol;
        accountType: AccountType;
        accountIndex: number;
    }) => {
        switch (flowType) {
            case 'accounts':
                navigation.replace(RootStackRoutes.AccountDetail, {
                    networkSymbol: symbol,
                    accountType,
                    accountIndex,
                    closeActionType: 'close',
                });
                break;

            case 'home':
            case 'receive':
                navigation.replace(RootStackRoutes.ReceiveModal, {
                    networkSymbol: symbol,
                    accountType,
                    accountIndex,
                    closeActionType: 'close',
                });

                break;
        }
    };

    const clearNetworkWithTypeToBeAdded = () => {
        setNetworkSymbolWithTypeToBeAdded(null);
    };

    const checkCanAddAccount = (accounts: Account[]) => {
        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return false;
        }

        // Do not allow adding more than 10 accounts of the same type
        if (accounts.filter(account => account.visible).length >= LIMIT) {
            showTooManyAccountsAlert();

            return false;
        }

        // Do not allow showing another empty account if there is already one
        const hasVisibleEmptyAccount = accounts.some(account => account.empty && account.visible);

        if (hasVisibleEmptyAccount) {
            showAnotherEmptyAccountAlert();

            return false;
        }

        return true;
    };

    const handleAccountTypeSelection = flowType => {
        if (networkSymbolWithTypeToBeAdded) {
            clearNetworkWithTypeToBeAdded();
            navigation.navigate(AddCoinAccountStackRoutes.SelectAccountType, {
                accountType: networkSymbolWithTypeToBeAdded[1] ?? NORMAL_ACCOUNT_TYPE,
                networkSymbol: networkSymbolWithTypeToBeAdded[0],
                flowType,
            });
        }
    };

    const addCoinAccount = async ({
        symbol,
        flowType,
        accountType = NORMAL_ACCOUNT_TYPE,
    }: {
        symbol: NetworkSymbol;
        flowType: AddCoinFlowType;
        accountType?: AccountType;
    }) => {
        clearNetworkWithTypeToBeAdded();
        if (!device?.state) {
            showGeneralErrorAlert();

            return;
        }

        const accounts = deviceAccounts.filter(
            account => account.symbol === symbol && account.accountType === accountType,
        );

        const firstHiddenEmptyAccount = pipe(
            accounts,
            A.filter(account => account.empty && !account.visible),
            A.sortBy(account => account.index),
            A.head,
        );

        const canAddAccount = checkCanAddAccount(accounts);

        if (!canAddAccount) {
            return;
        }

        const network = getNetwork(symbol);

        //If the account already exists, but is invisible, make it visible
        if (firstHiddenEmptyAccount) {
            dispatch(accountsActions.changeAccountVisibility(firstHiddenEmptyAccount));
        }

        navigateToSuccessorScreen({
            flowType,
            symbol,
            accountType,
            accountIndex: firstHiddenEmptyAccount?.index ?? accounts.length,
        });

        const newAccountResult = await dispatch(
            addAndDiscoverNetworkAccountThunk({
                network,
                accountType,
                deviceState: device.state.staticSessionId!,
            }),
        );

        if (
            !firstHiddenEmptyAccount && // Do not show error if we are just making the first hidden empty account visible
            isRejected(newAccountResult)
        ) {
            let screen = AppTabsRoutes.HomeStack;
            if (flowType === 'accounts') {
                screen = AppTabsRoutes.AccountsStack;
            } else if (flowType === 'receive') {
                screen = AppTabsRoutes.ReceiveStack;
            }

            if (newAccountResult.payload === 'Passphrase is incorrect') {
                showPassphraseAuthAlert();
            } else {
                showGeneralErrorAlert();
            }
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: {
                                screen,
                            },
                        },
                    ],
                }),
            );
        }
    };

    const onSelectedNetworkItem = ({
        symbol,
        flowType,
    }: {
        symbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    }) => {
        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return;
        }

        if (!enabledDiscoveryNetworkSymbols.includes(symbol)) {
            clearNetworkWithTypeToBeAdded();
            navigation.replace(AddCoinAccountStackRoutes.AddCoinDiscoveryRunning, {
                networkSymbol: symbol,
                flowType,
            });

            return;
        }

        const types = getAvailableAccountTypesForNetworkSymbol({ symbol });

        if (types.length > 1) {
            setDefaultAccountToBeAdded(symbol);
        } else {
            addCoinAccount({ symbol, flowType });
        }
    };

    return {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        getAvailableAccountTypesForNetworkSymbol,
        addCoinAccount,
        navigateToSuccessorScreen,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
        getAccountTypeToBeAddedName,
        handleAccountTypeSelection,
    };
};
