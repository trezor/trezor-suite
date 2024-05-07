import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Button } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    selectAccountByKey,
    selectNetworkFeeInfo,
    selectSendFormDraftByAccountKey,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { onDeviceTransactionReviewThunk } from '../sendFormThunks';
import { SendFormValues, sendFormValidationSchema } from '../sendFormSchema';

type SendFormProps = {
    accountKey: AccountKey;
};

const amountTransformer = (value: string) =>
    value
        .replace(/[^0-9\.]/g, '') // remove all non-numeric characters
        .replace(/^\./g, '') // remove '.' symbol if it is not preceded by number
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/(?<=^0+)0/g, ''); // remove all leading zeros except the first one

const constructFormDraft = ({ amount, address }: SendFormValues): FormState => ({
    outputs: [
        {
            type: 'payment',
            address,
            amount,
            token: null,
            fiat: '0',
            currency: { label: 'usd', value: '1000' },
        },
    ],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    feeLimit: '0',
    feePerUnit: '0',
    options: [],
});

export const SendForm = ({ accountKey }: SendFormProps) => {
    const dispatch = useDispatch();

    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendReview>>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );

    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByAccountKey(state, accountKey),
    );

    const form = useForm<SendFormValues>({
        validation: sendFormValidationSchema,
        context: {
            networkFeeInfo,
            networkSymbol: account?.symbol,
            availableAccountBalance: account?.availableBalance,
        },
        defaultValues: {
            // TODO handle multiple output fields???
            address:
                sendFormDraft?.outputs[0]?.address ?? 'tb1qkajycr9x7w3f3w997gfcvej35a52xj382wps0w',
            amount: sendFormDraft?.outputs[0]?.amount,
        },
    });

    const {
        handleSubmit,
        getValues,
        formState: { isValid: isFormValid, isSubmitting },
    } = form;

    const getFormState = useCallback((): SendFormValues => {
        return { address: getValues('address'), amount: getValues('amount') };
    }, [getValues]);

    const storeFormDraftIfValid = useCallback(() => {
        if (isFormValid) {
            dispatch(
                sendFormActions.storeDraft({
                    accountKey,
                    formState: constructFormDraft(getFormState()),
                }),
            );
        } else {
            // wipeDraft
        }
    }, [accountKey, dispatch, getFormState, isFormValid]);

    useEffect(() => {
        // We want to persist the form draft on unMount when app is running.
        return () => storeFormDraftIfValid();
    }, [isSubmitting, storeFormDraftIfValid]);

    const handleNavigateToReviewScreen = handleSubmit(async () => {
        navigation.navigate(SendStackRoutes.SendReview, { accountKey });

        await dispatch(
            onDeviceTransactionReviewThunk({
                accountKey,
                formState: constructFormDraft(getFormState()),
            }),
        );
    });

    return (
        <Form form={form}>
            <VStack spacing="medium" padding="medium">
                <TextInputField
                    multiline
                    label="Address"
                    name="address"
                    maxLength={formInputsMaxLength.address}
                    accessibilityLabel="address input"
                    autoCapitalize="none"
                    testID="@send/address-input"
                />
                <TextInputField
                    label="Amount to send"
                    name="amount"
                    keyboardType="numeric"
                    accessibilityLabel="amount to send input"
                    testID="@send/amount-input"
                    valueTransformer={amountTransformer}
                />
                {isFormValid && (
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="validate send form"
                        testID="@send/form-submit-button"
                        onPress={handleNavigateToReviewScreen}
                    >
                        Review & Send
                    </Button>
                )}
            </VStack>
        </Form>
    );
};
