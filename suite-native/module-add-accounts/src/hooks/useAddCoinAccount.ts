import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { A, pipe } from '@mobily/ts-belt';

import { AccountType, NetworkSymbol, networks } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    LIMIT,
    selectDevice,
    selectDeviceAccounts,
    selectIsDeviceInViewOnlyMode,
    accountsActions,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import {
    addAndDiscoverNetworkAccountThunk,
    selectAreTestnetsEnabled,
    selectDiscoverySupportedNetworks,
    NORMAL_ACCOUNT_TYPE,
} from '@suite-native/discovery';
import { TxKeyPath, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
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

type NavigationProps = StackToStackCompositeNavigationProps<
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
    const openLink = useOpenLink();
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const supportedNetworks = useSelector((state: DeviceRootState) =>
        selectDiscoverySupportedNetworks(state, areTestnetsEnabled),
    );
    const deviceAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccounts(state),
    );
    const device = useSelector(selectDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showAlert, hideAlert } = useAlert();
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const navigation = useNavigation<NavigationProps>();
    const [networkSymbolWithTypeToBeAdded, setNetworkSymbolWithTypeToBeAdded] = useState<
        [NetworkSymbol, AccountType] | null
    >(null);

    const supportedNetworkSymbols = pipe(
        supportedNetworks,
        A.map(n => n.symbol),
        A.uniq,
    );

    const availableNetworkAccountTypes = useMemo(() => {
        // first account type for every network is set to normal and represents default type
        const availableTypes: Map<NetworkSymbol, [AccountType, ...AccountType[]]> = new Map();

        Object.keys(networks).forEach(symbol => {
            // for Cardano only allow latest account type and coinjoin is not supported
            const types = Object.keys(networks[symbol].accountTypes).filter(
                t => !['coinjoin', 'imported', 'ledger'].includes(t),
            ) as AccountType[];

            availableTypes.set(symbol as NetworkSymbol, [
                NORMAL_ACCOUNT_TYPE,
                ...(symbol === 'ada' ? [] : types),
            ]);
        });

        return availableTypes;
    }, []);

    const getAvailableAccountTypesForNetworkSymbol = ({
        networkSymbol,
    }: {
        networkSymbol: NetworkSymbol;
    }) => availableNetworkAccountTypes.get(networkSymbol) ?? [NORMAL_ACCOUNT_TYPE];

    const getNetworkToAdd = ({
        networkSymbol,
        accountType,
    }: {
        networkSymbol: NetworkSymbol;
        accountType?: AccountType;
    }) => {
        const type = accountType ?? NORMAL_ACCOUNT_TYPE;

        return supportedNetworks.filter(
            network =>
                network.symbol === networkSymbol &&
                (type === NORMAL_ACCOUNT_TYPE
                    ? network.accountType === undefined
                    : network.accountType === type),
        )[0];
    };

    const showTooManyAccountsAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.tooManyAccounts.title'),
            description: translate('moduleAddAccounts.alerts.tooManyAccounts.description'),
            icon: 'warningCircleLight',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.tooManyAccounts.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    const showAnotherEmptyAccountAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.anotherEmptyAccount.title'),
            description: translate('moduleAddAccounts.alerts.anotherEmptyAccount.description'),
            icon: 'warningCircleLight',
            pictogramVariant: 'red',
            primaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionPrimary',
            ),
            onPressPrimaryButton: hideAlert,
            secondaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionSecondary',
            ),
            onPressSecondaryButton: () => {
                openLink(
                    translate('moduleAddAccounts.alerts.anotherEmptyAccount.actionSecondaryUrl'),
                );
                hideAlert();
            },
        });

    const showGeneralErrorAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.generalError.title'),
            description: translate('moduleAddAccounts.alerts.generalError.description'),
            icon: 'warningCircleLight',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.generalError.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    const setDefaultAccountToBeAdded = (networkSymbol: NetworkSymbol) => {
        const defaultType = getAvailableAccountTypesForNetworkSymbol({ networkSymbol })[0];
        setNetworkSymbolWithTypeToBeAdded([networkSymbol, defaultType]);
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
        if (accounts.length >= LIMIT) {
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

    const navigateToAccountTypeSelectionScreen = (
        networkSymbol: NetworkSymbol,
        flowType: AddCoinFlowType,
        accountType?: AccountType,
    ) => {
        clearNetworkWithTypeToBeAdded();
        navigation.navigate(AddCoinAccountStackRoutes.SelectAccountType, {
            accountType: accountType ?? NORMAL_ACCOUNT_TYPE,
            networkSymbol,
            flowType,
        });
    };

    const navigateToSuccessorScreen = ({
        flowType,
        networkSymbol,
        accountType,
        accountIndex,
    }: {
        flowType: AddCoinFlowType;
        networkSymbol: NetworkSymbol;
        accountType: AccountType;
        accountIndex: number;
    }) => {
        switch (flowType) {
            case 'accounts':
                navigation.replace(RootStackRoutes.AccountDetail, {
                    networkSymbol,
                    accountType,
                    accountIndex,
                    closeActionType: 'close',
                });
                break;

            case 'home':
            case 'receive':
                navigation.replace(RootStackRoutes.ReceiveModal, {
                    networkSymbol,
                    accountType,
                    accountIndex,
                    closeActionType: 'close',
                });

                break;
        }
    };

    const addCoinAccount = async ({
        networkSymbol,
        flowType,
        accountType = NORMAL_ACCOUNT_TYPE,
    }: {
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
        accountType?: AccountType;
    }) => {
        clearNetworkWithTypeToBeAdded();
        if (!device?.state) {
            showGeneralErrorAlert();

            return;
        }

        const accounts = deviceAccounts.filter(
            account => account.symbol === networkSymbol && account.accountType === accountType,
        );

        const firstHiddenEmptyAccount = accounts.find(account => account.empty && !account.visible);

        const canAddAccount = checkCanAddAccount(accounts);

        if (!canAddAccount) {
            return;
        }

        const network = getNetworkToAdd({ networkSymbol, accountType });

        navigateToSuccessorScreen({
            flowType,
            networkSymbol,
            accountType,
            accountIndex: firstHiddenEmptyAccount?.index ?? accounts.length,
        });

        if (firstHiddenEmptyAccount) {
            dispatch(accountsActions.changeAccountVisibility(firstHiddenEmptyAccount));
        }

        const account =
            firstHiddenEmptyAccount ||
            (await dispatch(
                addAndDiscoverNetworkAccountThunk({
                    network,
                    deviceState: device.state,
                }),
            ).unwrap());

        if (!account) {
            let screen = AppTabsRoutes.HomeStack;
            if (flowType === 'accounts') {
                screen = AppTabsRoutes.AccountsStack;
            } else if (flowType === 'receive') {
                screen = AppTabsRoutes.ReceiveStack;
            }

            showGeneralErrorAlert();
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
        networkSymbol,
        flowType,
    }: {
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    }) => {
        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return;
        }

        const types = getAvailableAccountTypesForNetworkSymbol({ networkSymbol });

        if (types.length > 1) {
            setDefaultAccountToBeAdded(networkSymbol);
        } else {
            addCoinAccount({ networkSymbol, flowType });
        }
    };

    return {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        getAvailableAccountTypesForNetworkSymbol,
        addCoinAccount,
        navigateToAccountTypeSelectionScreen,
        networkSymbolWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
    };
};
