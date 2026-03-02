import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AccountsRootState, accountsActions, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountFormValues,
    AccountLabelFieldHint,
    MAX_ACCOUNT_LABEL_LENGTH,
    useAccountLabelForm,
} from '@suite-native/accounts';
import { Box, Button, InputType, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    CombinedLabelingState,
    selectAccountLabel,
    selectIsLabellingAllowed,
    useSuiteSyncErrorHandler,
} from '@suite-native/labeling';
import { useNativeServices } from '@suite-native/services';

type AccountRenameFormProps = {
    accountKey: AccountKey;
    onSubmit: () => void;
};

export const AccountRenameForm = ({ accountKey, onSubmit }: AccountRenameFormProps) => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const { suiteSync } = useNativeServices();
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const inputRef = useRef<InputType>(null);

    const accountLabel = useSelector((state: CombinedLabelingState) => {
        if (!account) return null;

        return selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol);
    });

    const form = useAccountLabelForm(accountLabel ?? undefined);
    const {
        handleSubmit,
        formState: { isValid },
        control,
    } = form;

    useEffect(() => {
        // Focus account label input field and open keyboard on the first render.
        // Timeout is needed to prevent random placement of the cursor at beginning of the input field instead of the end.
        // Also, it's needed to prevent the keyboard from opening when the modal is animating.
        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timeout);
    }, [inputRef]);

    if (!account) return null;

    const handleRenameAccount = handleSubmit(async (formValues: AccountFormValues) => {
        if (isLabellingAllowed) {
            if (!account.deviceState) return;

            const result = await suiteSync.labeling.updateAccountLabel({
                deviceStaticSessionId: account.deviceState,
                accountKey,
                label: formValues.accountLabel,
            });

            if (!result.success) {
                return handleSuiteSyncError(result.error);
            }
        } else {
            dispatch(accountsActions.renameAccount(accountKey, formValues.accountLabel));
        }
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
                        asBottomSheetInput
                        testID="@account-detail/settings/account-rename/input"
                    />
                    <AccountLabelFieldHint formControl={control} />
                    <Button
                        onPress={handleRenameAccount}
                        size="large"
                        isDisabled={!isValid}
                        testID="@account-detail/settings/account-rename/confirm-button"
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                </VStack>
            </Form>
        </Box>
    );
};
