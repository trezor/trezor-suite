import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A, pipe } from '@mobily/ts-belt';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';

import {
    type DeviceRootState,
    selectIsDeviceInViewOnlyMode,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type AccountType,
    NORMAL_ACCOUNT_TYPE,
    type NetworkSymbol,
    networkSymbolCollection,
    networks,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    accountsActions,
    reportWalletBalanceThunk,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAvailableAccountTypes,
    isEvmNetwork,
    prepareNewAccountPayload,
} from '@suite-common/wallet-utils';
import { useAccountAlerts } from '@suite-native/accounts';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    selectDeviceEnabledDiscoveryNetworkSymbols,
    selectDiscoveryNetworkSymbols,
} from '@suite-native/discovery';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { navigateByAccountState } from '@suite-native/module-earn';
import {
    type AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    type AddCoinFlowType,
    AppTabsRoutes,
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';
import { resolveAfter } from '@trezor/utils';

import { useAddCoinAccountAlerts } from './useAddCoinAccountAlerts';

export type AddCoinAccountNavigationProps = StackToStackCompositeNavigationProps<
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes.AddCoinAccount,
    RootStackParamList
>;

export type AddCoinEnabledAccountType = Exclude<
    AccountType,
    'coinjoin' | 'imported' | 'ledger' | 'placeholder'
>;

export const accountTypeTranslationKeys: Record<
    AddCoinEnabledAccountType,
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

const LIMIT = 10; // Maximum number of manually added accounts per non-EVM network type.

export const useAddCoinAccount = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { name: routeName } = useRoute();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

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
        [NetworkSymbol, AddCoinEnabledAccountType] | null
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
                ...(['ada', 'eth', 'pol', 'bsc', 'sol', 'op', 'base', 'arb', 'avax'].includes(
                    symbol,
                )
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
        const type = defaultType as AddCoinEnabledAccountType;

        if (type) {
            setNetworkSymbolWithTypeToBeAdded([symbol, type]);
            openModal();
        }
    };

    const navigateToEarnAfterDiscovery = (symbol: NetworkSymbol, accountIndex: number) => {
        const account = deviceAccounts.find(
            acc =>
                acc.symbol === symbol &&
                acc.accountType === NORMAL_ACCOUNT_TYPE &&
                acc.index === accountIndex,
        );

        if (!account) {
            showGeneralErrorAlert();
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: { screen: AppTabsRoutes.EarnStack },
                        },
                    ],
                }),
            );

            return;
        }

        navigateByAccountState(account, navigation.navigate);
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
            case 'earn':
                navigateToEarnAfterDiscovery(symbol, accountIndex);
                break;
            case 'home':
                navigation.replace(RootStackRoutes.ReceiveStack, {
                    screen: ReceiveStackRoutes.ReceiveAccount,
                    params: {
                        networkSymbol: symbol,
                        accountType,
                        accountIndex,
                        closeActionType: 'close',
                    },
                });
                break;
            case 'accounts':
                navigation.replace(RootStackRoutes.AccountDetail, {
                    networkSymbol: symbol,
                    accountType,
                    accountIndex,
                    closeActionType: 'close',
                });
                break;
            case 'receive':
                navigation.navigate(RootStackRoutes.ReceiveStack, {
                    screen: ReceiveStackRoutes.ReceiveAccount,
                    params: {
                        networkSymbol: symbol,
                        accountType,
                        accountIndex,
                        closeActionType: 'back',
                    },
                });
                break;
            case 'trade':
                if (
                    routeName === AddCoinAccountStackRoutes.AddCoinDiscoveryFinished ||
                    routeName === AddCoinAccountStackRoutes.SelectAccountType
                ) {
                    navigation.popToTop();
                }
                break;

            default:
                return exhaustive(flowType);
        }
    };

    const navigateToFailureScreen = ({
        flowType,
        errorString,
    }: {
        flowType: AddCoinFlowType;
        errorString: string | undefined;
    }) => {
        let screen: AppTabsRoutes;
        switch (flowType) {
            case 'home':
            case 'receive':
                screen = AppTabsRoutes.HomeStack;
                break;
            case 'accounts':
                screen = AppTabsRoutes.AccountsStack;
                break;
            case 'trade':
                screen = AppTabsRoutes.TradeStack;
                break;
            case 'earn':
                screen = AppTabsRoutes.EarnStack;
                break;

            default:
                return exhaustive(flowType);
        }

        if (errorString === 'Passphrase is incorrect') {
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
    };

    const clearNetworkWithTypeToBeAdded = () => {
        setNetworkSymbolWithTypeToBeAdded(null);
        closeModal();
    };

    const checkCanAddAccount = (accounts: Account[], networkSymbol: NetworkSymbol) => {
        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return false;
        }

        // EVM networks have no manual-add limit. Users can add accounts beyond
        if (isEvmNetwork(networkSymbol)) {
            return true;
        }

        // Do not allow adding more than 10 accounts of the same type.
        if (accounts.filter(account => account.visible).length >= LIMIT) {
            showTooManyAccountsAlert();

            return false;
        }

        const hasVisibleEmptyAccount = accounts.some(account => account.empty && account.visible);

        if (hasVisibleEmptyAccount) {
            showAnotherEmptyAccountAlert();

            return false;
        }

        return true;
    };

    const createNewEvmAccount = async ({
        symbol,
        accountType,
        accounts,
        flowType,
    }: {
        symbol: NetworkSymbol;
        accountType: AccountType;
        accounts: Account[];
        flowType: AddCoinFlowType;
    }) => {
        if (!device) {
            showGeneralErrorAlert();

            return;
        }

        const lastVisibleAccount = pipe(
            accounts,
            A.filter(account => account.visible),
            A.sortBy(account => account.index),
            A.last,
        );

        const nextIndex = lastVisibleAccount ? lastVisibleAccount.index + 1 : 0;
        const network = networks[symbol];
        const networkAccount = network.accountTypes[accountType];
        const allAccountTypes = getAvailableAccountTypes(symbol);

        const newAccountPayload = await prepareNewAccountPayload({
            accountType,
            networkSymbol: symbol,
            index: nextIndex,
            backendType:
                lastVisibleAccount?.backendType !== 'coinjoin'
                    ? lastVisibleAccount?.backendType
                    : undefined,
            selectedAccount: networkAccount,
            accountTypes: allAccountTypes,
            device,
        });

        if (newAccountPayload instanceof Error) {
            showGeneralErrorAlert();

            return;
        }

        dispatch(accountsActions.createAccount(newAccountPayload));
        dispatch(reportWalletBalanceThunk());
        navigateToSuccessorScreen({
            flowType,
            symbol,
            accountType,
            accountIndex: nextIndex,
        });
    };

    const handleAccountTypeSelection = (flowType: AddCoinFlowType) => {
        if (networkSymbolWithTypeToBeAdded) {
            clearNetworkWithTypeToBeAdded();
            navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
                screen: AddCoinAccountStackRoutes.SelectAccountType,
                params: {
                    accountType: networkSymbolWithTypeToBeAdded[1] ?? NORMAL_ACCOUNT_TYPE,
                    networkSymbol: networkSymbolWithTypeToBeAdded[0],
                    flowType,
                },
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
        try {
            clearNetworkWithTypeToBeAdded();

            if (!device?.state) {
                showGeneralErrorAlert();

                return;
            }

            const accounts = deviceAccounts.filter(
                account => account.symbol === symbol && account.accountType === accountType,
            );

            const canAddAccount = checkCanAddAccount(accounts, symbol);

            if (!canAddAccount) {
                return;
            }

            const firstHiddenEmptyAccount = pipe(
                accounts,
                A.filter(account => account.empty && !account.visible),
                A.sortBy(account => account.index),
                A.head,
            );

            // the account should already exist, but be invisible, so make it visible
            if (firstHiddenEmptyAccount && !firstHiddenEmptyAccount.failed) {
                dispatch(accountsActions.changeAccountVisibility(firstHiddenEmptyAccount));
                dispatch(reportWalletBalanceThunk());
                navigateToSuccessorScreen({
                    flowType,
                    symbol,
                    accountType,
                    accountIndex: firstHiddenEmptyAccount.index ?? accounts.length,
                });

                return;
            }

            // For EVM networks: allow adding next account even if previous is empty
            if (isEvmNetwork(symbol)) {
                await createNewEvmAccount({ symbol, accountType, accounts, flowType });

                return;
            }

            // or the account discovery might have failed
            if (firstHiddenEmptyAccount?.failed) {
                navigateToFailureScreen({ flowType, errorString: firstHiddenEmptyAccount.error });
            }
        } catch {
            showGeneralErrorAlert();
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

            if (flowType === 'trade') {
                navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
                    screen: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning,
                    params: {
                        networkSymbol: symbol,
                        flowType,
                    },
                });
            } else {
                navigation.replace(AddCoinAccountStackRoutes.AddCoinDiscoveryRunning, {
                    networkSymbol: symbol,
                    flowType,
                });
            }

            return;
        }

        const types = getAvailableAccountTypesForNetworkSymbol({ symbol });

        if (types.length > 1) {
            setDefaultAccountToBeAdded(symbol);
        } else {
            addCoinAccount({ symbol, flowType });
        }
    };

    const handleAccountTypeConfirmation = async (flowType: AddCoinFlowType) => {
        if (networkSymbolWithTypeToBeAdded) {
            clearNetworkWithTypeToBeAdded();
            // TODO why timeout?
            await resolveAfter(100);
            await addCoinAccount({
                symbol: networkSymbolWithTypeToBeAdded[0],
                accountType: networkSymbolWithTypeToBeAdded[1],
                flowType,
            });
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
        handleAccountTypeConfirmation,
        bottomSheetRef,
    };
};
