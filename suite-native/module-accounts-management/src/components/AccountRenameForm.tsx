import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWatch, Control } from 'react-hook-form';

import { TextInput } from 'react-native/types';

import { Box, Text, Button, VStack } from '@suite-native/atoms';
import { TextInputField, Form } from '@suite-native/forms';
import {
    useAccountLabelForm,
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
        <Box paddingLeft="s">
            <Text variant="label" color="textSubdued">
                {accountLabel ? accountLabel.length : 0} / {MAX_ACCOUNT_LABEL_LENGTH} letters
            </Text>
        </Box>
    );
};

export const AccountRenameForm = ({ accountKey, onSubmit }: AccountRenameFormProps) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const inputRef = useRef<TextInput>(null);

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const form = useAccountLabelForm(accountLabel ?? undefined);
    const {
        handleSubmit,
        formState: { isValid },
        control,
    } = form;

    // Focus account label input field and open keyboard on the first render.
    useEffect(() => {
        inputRef.current?.focus();
    }, [inputRef]);

    if (!account) return null;

    const handleRenameAccount = handleSubmit((formValues: AccountFormValues) => {
        dispatch(accountsActions.renameAccount(accountKey, formValues.accountLabel));
        onSubmit();
    });

    return (
        <Box marginTop="m">
            <Form form={form}>
                <VStack spacing="s">
                    <TextInputField
                        ref={inputRef}
                        name="accountLabel"
                        label="Coin label"
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
