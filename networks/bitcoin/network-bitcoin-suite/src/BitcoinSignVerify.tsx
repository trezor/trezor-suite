import { useEffect, useState } from 'react';
import { type FieldError, useController } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    FormatSwitch,
    SIGN_VERIFY_BASE_DEFAULT_VALUES,
    SignVerifyAddressField,
    type SignVerifyBaseFields,
    SignVerifyMessageField,
    type SignVerifyOutcome,
    type SignVerifyPage,
    SignVerifySignatureField,
    SignVerifyTabs,
    signVerifyBaseSchema,
    useSignVerifyCopyValue,
    useSignVerifyForm,
} from '@suite/sign-verify';
import { useServices } from '@suite-common/dependency-injection';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { selectDispatch } from '@suite-common/redux-utils';
import { yup } from '@suite-common/validators';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';

import { type BitcoinSignVerifyActions } from './bitcoinSignVerifyActions';
import { getBitcoinSignAddresses } from './getBitcoinSignAddresses';
import { getHasSelectableSignatureFormat } from './getHasSelectableSignatureFormat';

type BitcoinSignVerifyFields = SignVerifyBaseFields & {
    isElectrum?: boolean;
};

const bitcoinSignVerifySchema: yup.ObjectSchema<BitcoinSignVerifyFields> = yup.object({
    ...signVerifyBaseSchema,
    isElectrum: yup.boolean(),
});

const DEFAULT_VALUES: BitcoinSignVerifyFields = {
    ...SIGN_VERIFY_BASE_DEFAULT_VALUES,
    isElectrum: false,
};

type BitcoinSignVerifyFormProps = {
    account: Account;
    actions: BitcoinSignVerifyActions;
    page: SignVerifyPage;
    onPageChange: (page: SignVerifyPage) => void;
};

const BitcoinSignVerifyForm = ({
    account,
    actions,
    page,
    onPageChange,
}: BitcoinSignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const { dispatch } = useServices(selectDispatch);

    const isSignPage = page === 'sign';

    const {
        control,
        register,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        setValue,
        hexField,
        addressField,
        pathField,
    } = useSignVerifyForm<BitcoinSignVerifyFields>({
        account,
        isSignPage,
        schema: bitcoinSignVerifySchema,
        defaultValues: DEFAULT_VALUES,
        resultFields: ['signature'],
        signedInputFields: ['address', 'message', 'isElectrum'],
    });

    const { field: isElectrumField } = useController({ control, name: 'isElectrum' });

    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const verificationInputs = [
        formValues.message,
        formValues.address,
        formValues.signature,
        formValues.hex,
    ].join('\u0000');

    // A failed verification is the only outcome that leaves the form editable, and it comes with no
    // Clear button, so editing the values it was about is the only way out of it.
    useEffect(() => {
        setOutcome(prev => {
            if (prev === 'failed') {
                return 'idle';
            }

            return prev;
        });
    }, [verificationInputs]);

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        resetForm();
        setOutcome('idle');
    };

    const onSubmit = async (data: BitcoinSignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                actions.signThunk(account, path, message, hex, isElectrum),
            );

            if (result) {
                setValue('signature', result.signature);
                setOutcome('signed');
            }
        } else if (signature !== undefined) {
            const result = await dispatch(
                actions.verifyThunk(account, address, message, signature, hex),
            );

            // Cancelling on the device leaves the form exactly as it was, the way a cancelled
            // signing does: nothing was verified, and nothing failed to verify either.
            if (result !== 'cancelled') {
                setOutcome(result === 'verified' ? 'verified' : 'failed');
            }
        }
    };

    return (
        <Card>
            <SignVerifyTabs page={page} canVerify outcome={outcome} onPageChange={onPageChange} />
            <form onSubmit={formSubmit(onSubmit)}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {isSignPage && getHasSelectableSignatureFormat(account) && !isCompleted && (
                        <FormatSwitch
                            options={[
                                { value: false, label: <Translation id="TR_BIP_SIG_FORMAT" /> },
                                {
                                    value: true,
                                    label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />,
                                },
                            ]}
                            tooltip={
                                <Translation
                                    id="TR_FORMAT_TOOLTIP"
                                    values={{
                                        FormatDescription: chunks => <p>{chunks}</p>,
                                        span: chunks => <strong>{chunks}</strong>,
                                    }}
                                />
                            }
                            data-testid="@sign-verify/format"
                            selectedOption={isElectrumField.value}
                            onChange={isElectrumField.onChange}
                        />
                    )}
                    <SignVerifyAddressField
                        account={account}
                        signAddresses={getBitcoinSignAddresses(account, touchedAddresses)}
                        isSignPage={isSignPage}
                        isCompleted={isCompleted}
                        address={formValues.address}
                        pathField={pathField}
                        addressField={addressField}
                        pathError={getErrorMessage(formErrors.path)}
                        addressError={getErrorMessage(formErrors.address)}
                        hasPathError={!!formErrors.path}
                        hasAddressError={!!formErrors.address || hasFailedVerification}
                        onCopy={copyValue}
                    />
                    <SignVerifyMessageField
                        message={formValues.message}
                        isCompleted={isCompleted}
                        hasError={!!formErrors.message || hasFailedVerification}
                        errorMessage={getErrorMessage(formErrors.message)}
                        hexField={hexField}
                        registration={register('message')}
                        onCopy={copyValue}
                    />
                    <SignVerifySignatureField
                        signature={formValues.signature}
                        isSignPage={isSignPage}
                        isCompleted={isCompleted}
                        hasError={!!formErrors.signature || hasFailedVerification}
                        errorMessage={getErrorMessage(formErrors.signature)}
                        registration={register('signature')}
                        onCopy={copyValue}
                    />
                </Column>
                {isCompleted ? (
                    <Button
                        type="button"
                        intent="neutral"
                        priority="secondary"
                        onClick={clearForm}
                        data-testid="@sign-verify/clear"
                        minWidth={200}
                    >
                        <Translation id="TR_CLEAR" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        intent="brand"
                        isDisabled={isLocked()}
                        isLoading={isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        <Translation id={isSignPage ? 'TR_SIGN' : 'TR_VERIFY'} />
                    </Button>
                )}
            </form>
        </Card>
    );
};

type BitcoinSignVerifyProps = SignVerifyProps & {
    actions: BitcoinSignVerifyActions;
};

export const BitcoinSignVerify = ({ account, actions }: BitcoinSignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    return (
        // Each tab of each account is a form of its own: keying it throws away everything the
        // previous one was in the middle of, including the outcome it had reached.
        <BitcoinSignVerifyForm
            key={`${page}-${account.key}`}
            account={account}
            actions={actions}
            page={page}
            onPageChange={setPage}
        />
    );
};
