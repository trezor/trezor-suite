import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { networks } from '@suite-common/wallet-config';
import { VStack, Text, Spinner, SpinnerLoadingState } from '@suite-native/atoms';
import { AddCoinAccountStackRoutes, Screen } from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { Account } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountsByNetworkSymbol,
    selectHasDeviceDiscovery,
} from '@suite-common/wallet-core';
import {
    applyDiscoveryChangesThunk,
    selectEnabledDiscoveryNetworkSymbols,
    toggleEnabledDiscoveryNetworkSymbol,
} from '@suite-native/discovery';

import { AddCoinAccountNavigationProps, useAddCoinAccount } from '../hooks/useAddCoinAccount';

export const AddCoinDiscoveryRunningScreen = ({ route }) => {
    const { networkSymbol, flowType } = route.params;
    const dispatch = useDispatch();
    const navigation = useNavigation<AddCoinAccountNavigationProps>();
    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    );

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);
    const { navigateToSuccessorScreen, clearNetworkWithTypeToBeAdded } = useAddCoinAccount();
    const [loadingResult, setLoadingResult] = useState<SpinnerLoadingState>('idle');

    const goToAccountDetail = ({ account }: { account: Account }) => {
        navigateToSuccessorScreen({
            flowType,
            networkSymbol,
            accountType: account.accountType,
            accountIndex: account.index,
        });
    };

    const handleFinish = () => {
        const normalAccounts = accounts.filter(a => a.accountType === 'normal');
        const nonEmptyAccounts = accounts.filter(a => !a.empty);
        if (!hasDiscovery) {
            if (accounts.length > 0) {
                setLoadingResult('success');
            }

            if (nonEmptyAccounts.length > 0 && normalAccounts.length > 0) {
                clearNetworkWithTypeToBeAdded();
                navigation.replace(AddCoinAccountStackRoutes.AddCoinDiscoveryFinished, {
                    networkSymbol,
                    flowType,
                });
            } else if (accounts.length > 0) {
                goToAccountDetail({ account: normalAccounts[0] });
            }
        }
    };

    useEffect(() => {
        if (
            networkSymbol &&
            !enabledNetworkSymbols.includes(networkSymbol) &&
            accounts.length === 0 &&
            !hasDiscovery
        ) {
            dispatch(toggleEnabledDiscoveryNetworkSymbol(networkSymbol));
            dispatch(applyDiscoveryChangesThunk());
        }

        if (accounts.length > 0 && !hasDiscovery) {
            setLoadingResult('success');
        }
    }, [
        accounts.length,
        hasDiscovery,
        dispatch,
        enabledNetworkSymbols,
        loadingResult,
        networkSymbol,
    ]);

    return (
        <Screen>
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="extraLarge">
                <Spinner loadingState={loadingResult} onComplete={handleFinish} />
                <VStack spacing="extraSmall">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation
                            id="moduleAddAccounts.coinDiscoveryRunningScreen.title"
                            values={{ coin: networks[networkSymbol].name }}
                        />
                    </Text>
                    <Text variant="body" textAlign="center" color="textSubdued">
                        <Translation id="moduleAddAccounts.coinDiscoveryRunningScreen.subtitle" />
                    </Text>
                </VStack>
            </VStack>
        </Screen>
    );
};
