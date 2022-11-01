import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { Form, useForm } from '@suite-native/forms';
import { Button, Divider } from '@suite-native/atoms';
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
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { yup } from '@trezor/validation';
import { AccountsRootState, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';
import { AccountInfo } from '@trezor/connect';

import { AccountImportOverview } from './AccountImportOverview';
import { HIDDEN_DEVICE_ID, HIDDEN_DEVICE_STATE, importAccountThunk } from '../accountsImportThunks';
import { AccountImportSummarySection } from './AccountImportSummarySection';

type AccountImportSummaryFormProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>;

const accountImportFormValidationSchema = yup.object({
    accountLabel: yup.string().required().max(30),
});
type AccountImportFormValues = yup.InferType<typeof accountImportFormValidationSchema>;

export const AccountImportSummaryForm = ({
    networkSymbol,
    accountInfo,
}: AccountImportSummaryFormProps) => {
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
        <AccountImportSummarySection title="Import asset">
            <Form form={form}>
                <AccountImportOverview accountInfo={accountInfo} currencySymbol={networkSymbol} />
                <Divider />
                <Button
                    onPress={handleImportAccount}
                    size="large"
                    isDisabled={!!errors.accountLabel}
                >
                    Confirm
                </Button>
            </Form>
        </AccountImportSummarySection>
    );
};
