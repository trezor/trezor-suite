import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { AccountImportSummary } from '../components/AccountImportSummary';

export const AccountsImportScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>) => {
    const { xpubAddress, currencySymbol } = route.params;
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

    useEffect(() => {
        let ignore = false;

        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                { text: 'OK, I will fix it', onPress: () => navigation.goBack() },
            ]);
        };

        // TODO: show loader when account info is running, because otherwise it can finish after user already submitted
        // the form, the account is imported and user is somewhere in the app
        const getAccountInfo = async () => {
            const fetchedAccountInfo = await TrezorConnect.getAccountInfo({
                coin: currencySymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });
            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    console.log(fetchedAccountInfo.payload, 'fetched account');
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
    }, [xpubAddress, currencySymbol, navigation]);

    console.log(accountInfo?.descriptor, 'account descriptor');

    return (
        <Screen header={<AccountImportHeader activeStep={accountInfo ? 3 : 2} />}>
            {accountInfo ? (
                <AccountImportSummary accountInfo={accountInfo} networkSymbol={currencySymbol} />
            ) : (
                <AccountImportLoader />
            )}
        </Screen>
    );
};
