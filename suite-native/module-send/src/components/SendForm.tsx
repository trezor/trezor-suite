import React from 'react';
import { useSelector } from 'react-redux';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Button, Text } from '@suite-native/atoms';
import { useForm, Form, TextInputField } from '@suite-native/forms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectNetworkFeeInfo,
} from '@suite-common/wallet-core';

import { SendFormValues, sendFormValidationSchema } from '../sendFormSchema';

type SendFormProps = {
    accountKey: AccountKey;
};

const amountTransformer = (value: string) =>
    value
        .replace(/[^0-9\.]/g, '') // remove all non-numeric characters
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/(?<=^0+)0/g, ''); // remove all leading zeros except the first one

export const SendForm = ({ accountKey }: SendFormProps) => {
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
        formState: { isValid },
    } = form;

    const handleValidateForm = handleSubmit(() => {
        // TODO: start on-device inputs validation via TrezorConnect
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
                <VStack>
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="validate send form"
                        testID="@send/form-submit-button"
                        onPress={handleValidateForm}
                    >
                        Validate form
                    </Button>
                </VStack>
                {/* TODO: remove this message in followup PR */}
                {isValid && <Text color="textSecondaryHighlight">Form is valid 🎉</Text>}
            </VStack>
        </Form>
    );
};
