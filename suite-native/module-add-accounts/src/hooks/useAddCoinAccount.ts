import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { A, pipe } from '@mobily/ts-belt';

import { AccountType, NetworkSymbol, Network, networks } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    LIMIT,
    selectDevice,
    selectDeviceAccounts,
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
} from '@suite-native/navigation';

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
    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccounts(state),
    );
    const device = useSelector(selectDevice);
    const { showAlert, hideAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();
    const [networkWithTypeToBeAdded, setNetworkWithTypeToBeAdded] = useState<
        [Network, AccountType] | null
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

    const getAvailableAccountTypesForNetwork = ({ network }: { network: Network }) =>
        availableNetworkAccountTypes.get(network.symbol) ?? [NORMAL_ACCOUNT_TYPE as AccountType];

    const getDefaultAccountType = ({ network }: { network: Network }) =>
        getAvailableAccountTypesForNetwork({ network })[0];

    const getNetworkToAdd = ({
        networkSymbol,
        accountType,
    }: {
        networkSymbol: NetworkSymbol;
        accountType?: AccountType;
    }) => {
        const type =
            accountType ??
            getDefaultAccountType({
                network: supportedNetworks.filter(network => network.symbol === networkSymbol)[0],
            });

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
            onPressPrimaryButton: () => hideAlert(),
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
            onPressPrimaryButton: () => hideAlert(),
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
            onPressPrimaryButton: () => hideAlert(),
        });

    const setDefaultAccountToBeAdded = (network: Network) => {
        const defaultType = getAvailableAccountTypesForNetwork({ network })[0];
        setNetworkWithTypeToBeAdded([network, defaultType]);
    };

    const accountsForNetworSymbolkWithAccountType = ({
        network,
        accountType,
    }: {
        network: Network;
        accountType: AccountType;
    }) =>
        accounts.filter(
            account => account.symbol === network.symbol && account.accountType === accountType,
        );

    const clearNetworkWithTypeToBeAdded = () => {
        setNetworkWithTypeToBeAdded(null);
    };

    const checkCanAddAccount = ({
        network,
        accountType,
    }: {
        network: Network;
        accountType?: AccountType;
    }) => {
        const selectedType = accountType ?? getDefaultAccountType({ network });

        const currentAccountTypeAccounts = accountsForNetworSymbolkWithAccountType({
            network,
            accountType: selectedType,
        });

        // Do not allow adding more than 10 accounts of the same type
        if (currentAccountTypeAccounts.length > LIMIT) {
            showTooManyAccountsAlert();

            return false;
        }

        // Do not allow adding another empty account if there is already one
        const emptyAccounts = currentAccountTypeAccounts.filter(account => account.empty);

        if (emptyAccounts.length > 0) {
            showAnotherEmptyAccountAlert();

            return false;
        }

        return true;
    };

    const navigateToAccountTypeSelectionScreen = (network: Network, flowType: AddCoinFlowType) => {
        clearNetworkWithTypeToBeAdded();
        navigation.navigate(AddCoinAccountStackRoutes.SelectAccountType, {
            accountType: network.accountType ?? NORMAL_ACCOUNT_TYPE,
            network,
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
        if (flowType === 'receive') {
            navigation.replace(RootStackRoutes.ReceiveModal, {
                networkSymbol,
                accountType,
                accountIndex,
            });
        } else {
            navigation.replace(RootStackRoutes.AccountDetail, {
                networkSymbol,
                accountType,
                accountIndex,
            });
        }
    };

    const addCoinAccount = async ({
        network,
        accountType,
        flowType,
    }: {
        network: Network;
        accountType?: AccountType;
        flowType: AddCoinFlowType;
    }) => {
        clearNetworkWithTypeToBeAdded();
        if (!device?.state) {
            showGeneralErrorAlert();

            return;
        }

        const selectedType = accountType ?? getDefaultAccountType({ network });

        const canAddAccount = checkCanAddAccount({
            network,
            accountType: selectedType,
        });

        if (!canAddAccount) {
            return;
        }

        const accountsWithTypeLength = accountsForNetworSymbolkWithAccountType({
            network,
            accountType: selectedType,
        }).length;

        navigateToSuccessorScreen({
            flowType,
            networkSymbol: network.symbol,
            accountType: selectedType,
            accountIndex: accountsWithTypeLength,
        });

        const account = await dispatch(
            addAndDiscoverNetworkAccountThunk({
                network,
                accountType: selectedType,
                deviceState: device.state,
            }),
        ).unwrap();

        if (!account) {
            navigation.goBack();
            showGeneralErrorAlert();
        }
    };

    const onSelectedNetworkItem = ({
        networkSymbol,
        flowType,
    }: {
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    }) => {
        const network = getNetworkToAdd({ networkSymbol });

        const types = getAvailableAccountTypesForNetwork({ network });

        if (network) {
            if (types.length > 1) {
                setDefaultAccountToBeAdded(network);
            } else {
                addCoinAccount({ network, flowType });
            }
        }
    };

    return {
        supportedNetworkSymbols,
        onSelectedNetworkItem,
        getAvailableAccountTypesForNetwork,
        addCoinAccount,
        navigateToAccountTypeSelectionScreen,
        networkWithTypeToBeAdded,
        clearNetworkWithTypeToBeAdded,
    };
};
