import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import { isRejected } from '@reduxjs/toolkit';
import { useNavigation } from '@react-navigation/native';

import { VStack, Text, Box } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import {
    AccountKey,
    GeneralPrecomposedLevels,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';

import { signTransactionFeeLevelSigningThunk } from '../sendFormThunks';
import { SendFeesFormValues, sendFeesFormValidationSchema } from '../sendFeesFormSchema';
import { FeesFooter } from './FeesFooter';
import { FeeOptionsList } from './FeeOptionsList';

type SendFormProps = {
    accountKey: AccountKey;
    feeLevels: GeneralPrecomposedLevels;
};

type SendFeesNavigationProps = StackNavigationProps<SendStackParamList, SendStackRoutes.SendReview>;

const DEFAULT_FEE = 'normal';

export const SendFeesForm = ({ accountKey, feeLevels }: SendFormProps) => {
    const dispatch = useDispatch();
    const { showToast } = useToast();
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
    const feeLevelTransaction = feeLevels[selectedFeeLevel] as PrecomposedTransactionFinal;

    if (!account) return;

    const handleNavigateToReviewScreen = handleSubmit(async () => {
        navigation.navigate(SendStackRoutes.SendReview, { accountKey });
        const response = await dispatch(
            signTransactionFeeLevelSigningThunk({
                accountKey,
                feeLevel: feeLevelTransaction,
            }),
        );

        if (isRejected(response)) {
            // TODO: display error message based on the error code
            showToast({ variant: 'error', message: 'Something went wrong', icon: 'closeCircle' });

            navigation.navigate(SendStackRoutes.SendAccounts);
        }
    });

    return (
        <Form form={form}>
            <Box flex={1} justifyContent="space-between">
                <VStack spacing="small">
                    <Text variant="titleSmall">
                        <Translation id="moduleSend.fees.description.title" />
                    </Text>
                    <Text>
                        <Translation id="moduleSend.fees.description.body" />
                    </Text>
                    <FeeOptionsList feeLevels={feeLevels} networkSymbol={account.symbol} />
                </VStack>
                <FeesFooter
                    onSubmit={handleNavigateToReviewScreen}
                    totalAmount={feeLevelTransaction.totalSpent}
                    networkSymbol={account.symbol}
                />
            </Box>
        </Form>
    );
};
