import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';

const LOADING_ANIMATION_DURATION = 5000;

export const AccountImportLoadingScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>) => {
    const { xpubAddress, networkSymbol } = route.params;
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

        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                {
                    text: 'OK, I will fix it',
                    onPress: () =>
                        navigation.navigate(RootStackRoutes.AccountsImport, {
                            screen: AccountsImportStackRoutes.XpubScan,
                            params: {
                                networkSymbol,
                            },
                        }),
                },
            ]);
        };

        // TODO: show loader when account info is running, because otherwise it can finish after user already submitted
        // the form, the account is imported and user is somewhere in the app
        const getAccountInfo = async () => {
            const fetchedAccountInfo = await TrezorConnect.getAccountInfo({
                coin: networkSymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });
            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    setAccountInfo(fetchedAccountInfo.payload);
                } else {
                    showAccountInfoAlert({
                        title: 'Account info failed',
                        message: fetchedAccountInfo.payload?.error ?? '',
                    });
                }
            }
        };
        try {
            getAccountInfo();
        } catch (error) {
            if (!ignore) {
                showAccountInfoAlert({
                    title: 'Account info failed',
                    message: error?.message ?? '',
                });
            }
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, networkSymbol, navigation]);

    return (
        <Screen header={<AccountImportHeader activeStep={3} />}>
            <AccountImportLoader />
        </Screen>
    );
};
