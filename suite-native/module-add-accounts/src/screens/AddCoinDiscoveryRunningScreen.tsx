import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    changeCoinVisibility,
    selectDeviceAccountsByNetworkSymbol,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Spinner, SpinnerLoadingState, Text, VStack } from '@suite-native/atoms';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';

import { AddCoinAccountNavigationProps, useAddCoinAccount } from '../hooks/useAddCoinAccount';

export const AddCoinDiscoveryRunningScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.AddCoinDiscoveryRunning>) => {
    const { networkSymbol, flowType } = route.params;
    const dispatch = useDispatch();
    const navigation = useNavigation<AddCoinAccountNavigationProps>();
    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    );

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const { navigateToSuccessorScreen, clearNetworkWithTypeToBeAdded } = useAddCoinAccount();
    const [loadingResult, setLoadingResult] = useState<SpinnerLoadingState>('idle');

    const goToAccountDetail = ({ account }: { account: Account }) => {
        navigateToSuccessorScreen({
            flowType,
            symbol: networkSymbol,
            accountType: account.accountType,
            accountIndex: account.index,
        });
    };

    const handleFinish = () => {
        if (accounts.length === 0 || hasDiscovery) {
            return;
        }

        setLoadingResult('success');

        if (flowType === 'trade') {
            navigation.popToTop();

            return;
        }

        const normalAccounts = accounts.filter(a => a.accountType === 'normal');
        const nonEmptyAccounts = accounts.filter(a => !a.empty);

        if (nonEmptyAccounts.length > 0 && normalAccounts.length > 0) {
            clearNetworkWithTypeToBeAdded();
            navigation.replace(AddCoinAccountStackRoutes.AddCoinDiscoveryFinished, {
                networkSymbol,
                flowType,
            });

            return;
        }

        goToAccountDetail({ account: normalAccounts[0] });
    };

    useEffect(() => {
        if (
            networkSymbol &&
            !enabledNetworkSymbols.includes(networkSymbol) &&
            accounts.length === 0 &&
            !hasDiscovery
        ) {
            dispatch(
                changeCoinVisibility({
                    symbol: networkSymbol,
                    shouldBeVisible: true,
                }),
            );

            return;
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
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp32">
                <Spinner loadingState={loadingResult} onComplete={handleFinish} />
                <VStack spacing="sp4">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation
                            id="moduleAddAccounts.coinDiscoveryRunningScreen.title"
                            values={{ coin: getNetwork(networkSymbol).name }}
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
