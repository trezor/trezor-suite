import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Button } from '@suite-native/atoms';
import { useForm, Form, TextInputField } from '@suite-native/forms';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { useAsyncDebounce } from '@trezor/react-utils';
import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectNetworkFeeInfo,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

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

export const SendForm = ({ accountKey }: SendFormProps) => {
    const dispatch = useDispatch();
    const debounce = useAsyncDebounce();
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendReview>>();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );

    const form = useForm<SendFormValues>({
        validation: sendFormValidationSchema,
        context: {
            networkFeeInfo,
            networkSymbol: account?.symbol,
            availableAccountBalance: account?.availableBalance,
        },
        defaultValues: {
            address: '',
            amount: '',
        },
    });

    const {
        handleSubmit,
        watch,
        formState: { isValid: isFormValid },
    } = form;
    const rawValues = watch();

    useEffect(() => {
        // debounce the redux action so it is not triggered on every keystroke
        debounce(async () => {
            if (isFormValid) {
                // TODO: this object will be filled with more values in the future as the send form inputs will get more complex.
                const formValues: FormState = {
                    outputs: [
                        {
                            type: 'payment',
                            address: rawValues.address,
                            amount: rawValues.amount,
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
                };

                return await dispatch(
                    sendFormActions.storeDraft({ accountKey, formState: formValues }),
                );
            }
        });
    }, [isFormValid, dispatch, debounce, accountKey, rawValues]);

    const handleNavigateToReviewScreen = handleSubmit(() => {
        navigation.navigate(SendStackRoutes.SendReview, { accountKey });
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
