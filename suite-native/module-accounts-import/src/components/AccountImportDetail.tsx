import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { setOnboardingFinished } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, Divider, Text } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import { AccountsRootState, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';
import { yup } from '@trezor/validation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';

import { HIDDEN_DEVICE_ID, HIDDEN_DEVICE_STATE, importAccountThunk } from '../accountsImportThunks';
import { AccountImportOverview } from './AccountImportOverview';

type AccountImportDetailProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

const contentWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
}));

const accountImportFormValidationSchema = yup.object({
    accountLabel: yup.string().required().max(30),
});
type AccountImportFormValues = yup.InferType<typeof accountImportFormValidationSchema>;

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>;

export const AccountImportDetail = ({ networkSymbol, accountInfo }: AccountImportDetailProps) => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDevice(state, HIDDEN_DEVICE_STATE, networkSymbol),
    );
    const defaultAccountLabel = `${networks[networkSymbol].name} #${
        deviceNetworkAccounts.length + 1
    }`;
    const form = useForm<AccountImportFormValues>({
        validation: accountImportFormValidationSchema,
        defaultValues: {
            accountLabel: defaultAccountLabel,
        },
    });
    const {
        handleSubmit,
        formState: { errors },
    } = form;

    const handleImportAccount = handleSubmit(({ accountLabel }: AccountImportFormValues) => {
        dispatch(
            importAccountThunk({
                deviceId: HIDDEN_DEVICE_ID,
                deviceTitle: 'Hidden Device',
                accountInfo,
                accountLabel,
                coin: networkSymbol,
            }),
        );
        dispatch(setOnboardingFinished(true));
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    });

    return (
        <Box alignItems="center" flex={1}>
            <Text variant="titleMedium">Import Asset</Text>
            <Box style={applyStyle(contentWrapperStyle)}>
                <Form form={form}>
                    <AccountImportOverview
                        accountInfo={accountInfo}
                        currencySymbol={networkSymbol}
                    />
                    <Divider />
                    <Button
                        onPress={handleImportAccount}
                        size="large"
                        isDisabled={!!errors.accountLabel}
                    >
                        Confirm
                    </Button>
                </Form>
            </Box>
        </Box>
    );
};
