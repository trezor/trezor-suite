import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import {
    type AccountsRootState,
    accountsActions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type AccountFormValues,
    MAX_ACCOUNT_LABEL_LENGTH,
    useAccountLabelForm,
} from '@suite-native/accounts';
import { Box, Button, type InputType, VStack } from '@suite-native/atoms';
import { featureUsed } from '@suite-native/feature-feedback';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type CombinedLabelingState,
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
        formState: { errors },
        control,
    } = form;

    const hasErrors = Object.keys(errors).length > 0;

    const accountLabelLength = useWatch({ control, name: 'accountLabel' })?.length ?? 0;

    useEffect(() => {
        // Focus account label input field and open keyboard on the first render.
        // Timeout is needed to prevent random placement of the cursor at beginning of the input field instead of the end.
        // Also, it's needed to prevent the keyboard from opening when the modal is animating.
        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 1000); // If this is lower, than the position is sometimes miscalculated and the keybord jumps behind the keyboard.

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

            dispatch(featureUsed('suite-sync'));
        } else {
            dispatch(accountsActions.renameAccount(accountKey, formValues.accountLabel));
        }
        onSubmit();
    });

    const hint = translate('accounts.accountLabelFieldHint.letterCount', {
        current: accountLabelLength,
        max: MAX_ACCOUNT_LABEL_LENGTH,
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
                        hint={hasErrors ? undefined : hint}
                        maxLength={MAX_ACCOUNT_LABEL_LENGTH}
                        asBottomSheetInput
                        testID="@account-detail/settings/account-rename/input"
                    />
                    <Button
                        onPress={handleRenameAccount}
                        size="large"
                        isDisabled={hasErrors}
                        testID="@account-detail/settings/account-rename/confirm-button"
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                </VStack>
            </Form>
        </Box>
    );
};
