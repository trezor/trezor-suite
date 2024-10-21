import React from 'react';
import { useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import { useNavigation } from '@react-navigation/native';

import { VStack, Text, Box } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import {
    AccountKey,
    GeneralPrecomposedLevels,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectNetworkFeeLevelFeePerUnit,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';

import { SendFeesFormValues, sendFeesFormValidationSchema } from '../sendFeesFormSchema';
import { FeesFooter } from './FeesFooter';
import { FeeOptionsList } from './FeeOptionsList';
import { RecipientsSummary } from './RecipientsSummary';

type SendFormProps = {
    accountKey: AccountKey;
    feeLevels: GeneralPrecomposedLevels;
};

type SendFeesNavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendFees,
    RootStackParamList
>;

const DEFAULT_FEE = 'normal';

export const SendFeesForm = ({ accountKey, feeLevels }: SendFormProps) => {
    const navigation = useNavigation<SendFeesNavigationProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const form = useForm<SendFeesFormValues>({
        validation: sendFeesFormValidationSchema,
        defaultValues: {
            feeLevel: DEFAULT_FEE,
        },
    });
    const { handleSubmit, control } = form;

    const selectedFeeLevel = useWatch({ control, name: 'feeLevel' });
    const selectedFeeLevelTransaction = feeLevels[selectedFeeLevel] as PrecomposedTransactionFinal;

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelFeePerUnit(state, selectedFeeLevel, account?.symbol),
    );

    if (!account) return;

    const handleNavigateToReviewScreen = handleSubmit(() => {
        navigation.navigate(SendStackRoutes.SendAddressReview, {
            accountKey,
            transaction: selectedFeeLevelTransaction,
        });

        // In case that view only device is not connected, show connect screen first.
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
            params: {
                // If user cancels, navigate back to the send fees screen.
                onCancelNavigationTarget: {
                    name: RootStackRoutes.SendStack,
                    params: {
                        screen: SendStackRoutes.SendFees,
                        params: { accountKey, feeLevels },
                    },
                },
            },
        });
    });

    const normalFee = feeLevels.normal as PrecomposedTransactionFinal; // user is not allowed to enter this screen if normal fee is not final
    const transactionBytes = normalFee.bytes as number;

    // If trezor-connect was not able to compose the fee level, we have calculate total amount locally.
    const mockedFee = transactionBytes * Number(feePerUnit);
    const mockedTotalAmount = mockedFee + (Number(normalFee.totalSpent) - Number(normalFee.fee));
    const isSubmittable = selectedFeeLevelTransaction.type === 'final';

    return (
        <Form form={form}>
            <RecipientsSummary
                accountKey={accountKey}
                selectedFeeLevel={selectedFeeLevelTransaction}
            />
            <Box flex={1} justifyContent="space-between">
                <VStack spacing="sp16">
                    <VStack spacing="sp4">
                        <Text variant="titleSmall">
                            <Translation id="moduleSend.fees.description.title" />
                        </Text>
                        <Text>
                            <Translation id="moduleSend.fees.description.body" />
                        </Text>
                    </VStack>
                    <FeeOptionsList
                        feeLevels={feeLevels}
                        networkSymbol={account.symbol}
                        accountKey={accountKey}
                    />
                </VStack>
                <FeesFooter
                    isSubmittable={isSubmittable}
                    onSubmit={handleNavigateToReviewScreen}
                    totalAmount={selectedFeeLevelTransaction.totalSpent ?? mockedTotalAmount}
                    networkSymbol={account.symbol}
                />
            </Box>
        </Form>
    );
};
