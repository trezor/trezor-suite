import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWatch, Control } from 'react-hook-form';

import { Box, Text, Button, VStack } from '@suite-native/atoms';
import { TextInputField, Form } from '@suite-native/forms';
import {
    useAccountForm,
    AccountFormValues,
    MAX_ACCOUNT_LABEL_LENGTH,
} from '@suite-native/accounts';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';

type AccountRenameFormProps = {
    accountKey: string;
    onSubmit: () => void;
};

type AccountLabelFieldHintProps = {
    formControl: Control<AccountFormValues>;
};

const AccountLabelFieldHint = ({ formControl }: AccountLabelFieldHintProps) => {
    const { accountLabel } = useWatch({ control: formControl });
    return (
        <Box paddingLeft="small">
            <Text variant="label" color="gray600">
                {accountLabel.length} / {MAX_ACCOUNT_LABEL_LENGTH} letters
            </Text>
        </Box>
    );
};

export const AccountRenameForm = ({ accountKey, onSubmit }: AccountRenameFormProps) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const form = useAccountForm(accountLabel);
    const {
        handleSubmit,
        formState: { isValid },
        control,
    } = form;

    if (!account) return null;

    const handleRenameAccount = handleSubmit((formValues: AccountFormValues) => {
        dispatch(accountsActions.renameAccount(accountKey, formValues.accountLabel));
        onSubmit();
    });

    return (
        <Box marginTop="medium">
            <Form form={form}>
                <VStack spacing="small">
                    <TextInputField
                        name="accountLabel"
                        label="Account label"
                        maxLength={MAX_ACCOUNT_LABEL_LENGTH}
                    />
                    <AccountLabelFieldHint formControl={control} />
                    <Button onPress={handleRenameAccount} size="large" isDisabled={!isValid}>
                        Confirm
                    </Button>
                </VStack>
            </Form>
        </Box>
    );
};
