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
import { useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

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
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const [isAddingCoinAccount, setIsAddingCoinAccount] = useState<boolean>(false);

    const supportedNetworkSymbols = pipe(
        supportedNetworks,
        A.map(n => n.symbol),
        A.uniq,
    );

    const availableNetworkAccountTypes = useMemo(() => {
        // first account type for every network is set to normal and represents default type
        const availableTypes: Map<NetworkSymbol | undefined, AccountType[]> = new Map();
        Object.keys(networks).forEach(symbol =>
            availableTypes.set(symbol as NetworkSymbol, [
                NORMAL_ACCOUNT_TYPE,
                ...(Object.keys(networks[symbol].accountTypes) as AccountType[]).filter(
                    accountType => accountType !== 'coinjoin', // coinjoin is not supported
                ),
            ]),
        );
        return availableTypes;
    }, []);

    const getAvailableAccountTypesForNetwork = ({ network }: { network: Network }) =>
        availableNetworkAccountTypes.get(network.symbol) ?? [NORMAL_ACCOUNT_TYPE];

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
            icon: 'warningCircle',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.tooManyAccounts.actionPrimary'),
            onPressPrimaryButton: () => {
                hideAlert();
            },
        });

    const showAnotherEmptyAccountAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.anotherEmptyAccount.title'),
            description: translate('moduleAddAccounts.alerts.anotherEmptyAccount.description'),
            icon: 'warningCircle',
            pictogramVariant: 'red',
            primaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionPrimary',
            ),
            onPressPrimaryButton: () => {
                hideAlert();
            },
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

    const addCoinAccount = async ({ network, type }: { network: Network; type?: AccountType }) => {
        if (!device?.state) {
            return false;
        }

        const accountType = type ?? getDefaultAccountType({ network });

        const currentAccountTypeAccounts = accounts.filter(
            account => account.symbol === network.symbol && account.accountType === accountType,
        );

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

        setIsAddingCoinAccount(true);
        const account = await dispatch(
            addAndDiscoverNetworkAccountThunk({
                network,
                accountType,
                deviceState: device.state,
            }),
        ).unwrap();

        setIsAddingCoinAccount(false);

        if (account) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: account.key,
                tokenContract: undefined,
            });
        }
    };

    const onSelectedNetworkItem = (networkSymbol: NetworkSymbol) => {
        if (isAddingCoinAccount) {
            return;
        }
        const network = getNetworkToAdd({ networkSymbol });
        if (network) {
            addCoinAccount({ network });
        }
    };

    return {
        supportedNetworkSymbols,
        isAddingCoinAccount,
        onSelectedNetworkItem,
        getAvailableAccountTypesForNetwork,
        addCoinAccount,
    };
};
