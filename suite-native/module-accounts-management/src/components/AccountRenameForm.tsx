import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TextInput } from 'react-native/types';

import { Box, Button, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import {
    AccountFormValues,
    MAX_ACCOUNT_LABEL_LENGTH,
    useAccountLabelForm,
} from '@suite-native/accounts';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { AccountLabelFieldHint } from './AccountLabelFieldHint';

type AccountRenameFormProps = {
    accountKey: string;
    onSubmit: () => void;
};

export const AccountRenameForm = ({ accountKey, onSubmit }: AccountRenameFormProps) => {
    const { translate } = useTranslate();
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

    useEffect(() => {
        // Focus account label input field and open keyboard on the first render.
        // Timeout is needed to prevent random placement of the cursor at beginning of the input field instead of the end.
        // Also it's needed to prevent the keyboard from opening when the modal is animating.
        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timeout);
    }, [inputRef]);

    if (!account) return null;

    const handleRenameAccount = handleSubmit((formValues: AccountFormValues) => {
        dispatch(accountsActions.renameAccount(accountKey, formValues.accountLabel));
        onSubmit();
    });

    const coinLabelFieldLabel = translate(
        'moduleAccountManagement.accountSettingsScreen.renameForm.coinLabel',
    );

    return (
        <Box marginTop="sp16">
            <Form form={form}>
                <VStack spacing="sp8">
                    <TextInputField
                        ref={inputRef}
                        name="accountLabel"
                        label={coinLabelFieldLabel}
                        maxLength={MAX_ACCOUNT_LABEL_LENGTH}
                        testID="@account-detail/settings/account-rename/input"
                    />
                    <AccountLabelFieldHint formControl={control} />
                    <Button
                        onPress={handleRenameAccount}
                        size="large"
                        isDisabled={!isValid}
                        testID="@account-detail/settings/account-rename/confirm-button"
                    >
                        Confirm
                    </Button>
                </VStack>
            </Form>
        </Box>
    );
};
