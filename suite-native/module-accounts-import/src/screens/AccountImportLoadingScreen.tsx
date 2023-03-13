import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { updateCurrentFiatRatesThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';

const LOADING_ANIMATION_DURATION = 5000;
const DEFAULT_ALERT_MESSAGE = 'Account import failed';

export const AccountImportLoadingScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>) => {
    const { xpubAddress, networkSymbol } = route.params;
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [isAnimationFinished, setIsAnimationFinished] = useState(false);

    useEffect(() => {
        if (accountInfo && isAnimationFinished)
            navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
                accountInfo,
                networkSymbol,
            });
    }, [isAnimationFinished, accountInfo, navigation, networkSymbol]);

    useEffect(() => {
        // loader should disappear after 5 seconds soonest by design.
        const timeout = setTimeout(() => setIsAnimationFinished(true), LOADING_ANIMATION_DURATION);
        return () => clearTimeout(timeout);
    }, [setIsAnimationFinished]);

    useEffect(() => {
        let ignore = false;

        const showAccountInfoAlert = (message: string, retry: () => Promise<void>) => {
            showAlert({
                title: 'Network Error',
                description: message,
                primaryButtonTitle: 'Try Again',
                onPressPrimaryButton: retry,
                secondaryButtonTitle: 'Go back',
                onPressSecondaryButton: () =>
                    navigation.navigate(RootStackRoutes.AccountsImport, {
                        screen: AccountsImportStackRoutes.XpubScan,
                        params: {
                            networkSymbol,
                        },
                    }),
            });
        };

        const getAccountInfo = async () => {
            const fetchedAccountInfo = await TrezorConnect.getAccountInfo({
                coin: networkSymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });

            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    if (networkSymbol === 'eth') {
                        fetchedAccountInfo.payload.tokens?.forEach(token => {
                            dispatch(
                                updateCurrentFiatRatesThunk({
                                    ticker: {
                                        symbol: token.symbol as string,
                                        mainNetworkSymbol: 'eth',
                                        tokenAddress: token.address,
                                    },
                                }),
                            );
                        });
                    }
                    setAccountInfo(fetchedAccountInfo.payload);
                } else {
                    showAccountInfoAlert(fetchedAccountInfo.payload.error, getAccountInfo);
                }
            }
        };
        try {
            getAccountInfo();
        } catch (error) {
            if (!ignore) {
                showAccountInfoAlert(error?.message ?? DEFAULT_ALERT_MESSAGE, getAccountInfo);
            }
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, networkSymbol, navigation, dispatch, showAlert]);

    return (
        <Screen header={<AccountImportHeader activeStep={3} />}>
            <AccountImportLoader />
        </Screen>
    );
};
