import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Button, Column, Input, Modal, Row } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { submitWrapNativeTokenThunk } from 'src/actions/wallet/wrapNativeTokenThunks';
import { useDispatch } from 'src/hooks/suite';

type WrapNativeTokenModalProps = {
    account: Account;
    /** Max native amount that can be wrapped (balance minus the gas reserve), display units. */
    maxWrapAmount: string;
    nativeSymbol: string;
    wrappedSymbol: string;
    onCancel: () => void;
};

type FormData = {
    amount: string;
};

export const validateAmount =
    (translate: (id: TranslationKey) => string, maxWrapAmount: string) => (value: string) => {
        const amount = new BigNumber(value);

        if (amount.isNaN() || amount.lte(0)) {
            return translate('AMOUNT_IS_TOO_LOW');
        }

        if (amount.gt(maxWrapAmount)) {
            return translate('AMOUNT_IS_NOT_ENOUGH');
        }

        return true;
    };

// Debug-only modal (opened from the dashboard native-asset "Wrap" button) that collects the amount
// to wrap, then hands off to submitWrapNativeTokenThunk which drives the tx-simulation + signing.
export const WrapNativeTokenModal = ({
    account,
    maxWrapAmount,
    nativeSymbol,
    wrappedSymbol,
    onCancel,
}: WrapNativeTokenModalProps) => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid },
        control,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: { amount: '' },
    });

    // Watch the value so the Input's floating-label CSS animates in react-hook-form's uncontrolled
    // mode (see StellarTokenInputModal for the same pattern). useWatch (a hook) rather than the
    // useForm watch() function, which React Compiler can't memoize and flags as incompatible.
    const amount = useWatch({ control, name: 'amount' });

    const { ref: amountRef, ...amountField } = register('amount', {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: validateAmount(translationString, maxWrapAmount),
    });

    const onContinue = handleSubmit(async ({ amount: wrapAmount }) => {
        setIsSubmitting(true);
        // On success the thunk replaces this modal with the tx-simulation modal; on failure it shows
        // a toast and this modal stays open, so re-enable the button afterwards.
        await dispatch(submitWrapNativeTokenThunk({ account, wrapAmount }));
        setIsSubmitting(false);
    });

    return (
        <Modal
            onCancel={onCancel}
            heading={
                <Translation
                    id="TR_WRAP_NATIVE_TOKEN_MODAL_TITLE"
                    values={{ nativeSymbol, wrappedSymbol }}
                />
            }
            bottomContent={
                <Row gap={8}>
                    <Button
                        onClick={onContinue}
                        isDisabled={!isValid}
                        isLoading={isSubmitting}
                        intent="brand"
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <Column gap={16} alignItems="stretch">
                <Input
                    label={<Translation id="TR_WRAP_NATIVE_TOKEN_AMOUNT_LABEL" />}
                    value={amount}
                    innerRef={amountRef}
                    {...amountField}
                    hasError={!!errors.amount}
                    bottomText={errors.amount?.message || null}
                />
                <Row justifyContent="flex-end">
                    <Button
                        onClick={() => setValue('amount', maxWrapAmount, { shouldValidate: true })}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_WRAP_NATIVE_TOKEN_MAX" />
                    </Button>
                </Row>
            </Column>
        </Modal>
    );
};
