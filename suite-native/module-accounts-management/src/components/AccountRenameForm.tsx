import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { AccountsRootState, accountsActions, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountFormValues,
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
} from '@suite-native/labeling';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

type AccountRenameFormProps = {
    accountKey: AccountKey;
    onSubmit: () => void;
};

export const AccountRenameForm = ({ accountKey, onSubmit }: AccountRenameFormProps) => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
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

    const accountLabelLength = useWatch({ control, name: 'accountLabel' })?.length ?? 0;

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
                const { type } = result.error;
                switch (type) {
                    case 'SuiteSyncUnavailableOnDeviceError':
                    case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    case 'DeviceCancelled':
                    case 'DeviceError':
                    case 'SuiteSyncUpdateError':
                        showToast({ variant: 'error', icon: 'warning', message: type });

                        return;
                    case 'WriteModeRequiredForAllocation':
                        // Do nothing, this is expected control flow error when we want allocate on-demand.
                        return;

                    default:
                        return exhaustive(type);
                }
            }
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
                        hint={isValid ? hint : undefined}
                        maxLength={MAX_ACCOUNT_LABEL_LENGTH}
                        asBottomSheetInput
                        testID="@account-detail/settings/account-rename/input"
                    />
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
