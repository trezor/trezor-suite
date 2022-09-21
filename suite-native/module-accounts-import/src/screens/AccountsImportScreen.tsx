import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    RootStackRoutes,
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';
import { Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { setOnboardingFinished } from '@suite-native/module-settings';
import { AccountsRootState, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';
import { Form, useForm } from '@suite-native/forms';
import { yup } from '@trezor/validation';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { AccountImportOverview } from '../components/AccountImportOverview';
import { HIDDEN_DEVICE_ID, HIDDEN_DEVICE_STATE, importAccountThunk } from '../accountsImportThunks';

const assetsStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'space-between',
}));

const importAnotherWrapperStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
}));

const importAnotherButtonStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    width: 165,
}));

const accountImportFormValidationSchema = yup.object({
    accountLabel: yup.string().required().max(30),
});
type AccountImportFormValues = yup.InferType<typeof accountImportFormValidationSchema>;

export const AccountsImportScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>) => {
    const { xpubAddress, currencySymbol } = route.params;
    const dispatch = useDispatch();
    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDevice(state, HIDDEN_DEVICE_STATE, currencySymbol),
    );
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const defaultAccountLabel = `${currencySymbol} #${deviceNetworkAccounts.length + 1}`;
    const form = useForm<AccountImportFormValues>({
        validation: accountImportFormValidationSchema,
        defaultValues: {
            accountLabel: defaultAccountLabel,
        },
    });
    const { handleSubmit } = form;

    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        let ignore = false;

        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                { text: 'OK, I will fix it', onPress: () => navigation.goBack() },
            ]);
        };

        async function getAccountInfo() {
            const accountInfo = await TrezorConnect.getAccountInfo({
                coin: currencySymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });
            if (!ignore) {
                if (accountInfo?.success) {
                    setAccountInfo(accountInfo.payload);
                } else {
                    showAccountInfoAlert({
                        title: 'Account info failed',
                        message: accountInfo.payload?.error ?? '',
                    });
                }
            }
        }
        try {
            getAccountInfo();
        } catch (error) {
            showAccountInfoAlert({
                title: 'Account info failed',
                message: error?.message ?? '',
            });
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, currencySymbol, navigation]);

    const handleImportAccount = ({ accountLabel }: AccountImportFormValues) => {
        if (accountInfo) {
            dispatch(
                importAccountThunk({
                    deviceId: HIDDEN_DEVICE_ID,
                    deviceTitle: 'Hidden Device',
                    accountInfo,
                    accountLabel,
                    coin: currencySymbol,
                }),
            );
            dispatch(setOnboardingFinished(true));
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    };

    const handleImportAccountSubmit = handleSubmit(handleImportAccount);

    return (
        <Screen>
            {!accountInfo ? (
                <AccountImportLoader />
            ) : (
                <View style={[applyStyle(assetsStyle)]}>
                    <Form form={form}>
                        <View>
                            <AccountImportHeader />
                            <AccountImportOverview
                                accountInfo={accountInfo}
                                currencySymbol={currencySymbol}
                            />
                        </View>
                        <View style={applyStyle(importAnotherWrapperStyle)}>
                            <Button
                                style={applyStyle(importAnotherButtonStyle)}
                                onPress={() => navigation.goBack()}
                                colorScheme="gray"
                            >
                                Import another
                            </Button>
                        </View>
                        <Button onPress={handleImportAccountSubmit} size="large">
                            Confirm
                        </Button>
                    </Form>
                </View>
            )}
        </Screen>
    );
};
