import { useEffect, useMemo, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
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
import { selectDispatch } from '@suite-common/redux-utils';
import { yup } from '@suite-common/validators';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';

import { type EthereumSignVerifyActions } from './ethereumSignVerifyActions';
import { getEthereumSignAddresses } from './getEthereumSignAddresses';

const ethereumSignVerifySchema: yup.ObjectSchema<SignVerifyBaseFields> =
    yup.object(signVerifyBaseSchema);

type EthereumSignVerifyFormProps = {
    account: Account;
    actions: EthereumSignVerifyActions;
    page: SignVerifyPage;
    onPageChange: (page: SignVerifyPage) => void;
};

const EthereumSignVerifyForm = ({
    account,
    actions,
    page,
    onPageChange,
}: EthereumSignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const { dispatch } = useServices(selectDispatch);

    const isSignPage = page === 'sign';

    const {
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
    } = useSignVerifyForm<SignVerifyBaseFields>({
        account,
        isSignPage,
        schema: ethereumSignVerifySchema,
        defaultValues: SIGN_VERIFY_BASE_DEFAULT_VALUES,
        overrideValues: isSignPage
            ? { path: account.path, address: account.descriptor }
            : undefined,
        isPathDisabled: true,
        resultFields: ['signature'],
        signedInputFields: ['address', 'message'],
    });

    const signAddresses = useMemo(() => getEthereumSignAddresses(account), [account]);

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

    const onSubmit = async (data: SignVerifyBaseFields) => {
        const { address, path, message, signature, hex } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(actions.signThunk(account, path, message, hex));

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
                    <SignVerifyAddressField
                        account={account}
                        signAddresses={signAddresses}
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

type EthereumSignVerifyProps = SignVerifyProps & {
    actions: EthereumSignVerifyActions;
};

export const EthereumSignVerify = ({ account, actions }: EthereumSignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    return (
        // Each tab of each account is a form of its own: keying it throws away everything the
        // previous one was in the middle of, including the outcome it had reached.
        <EthereumSignVerifyForm
            key={`${page}-${account.key}`}
            account={account}
            actions={actions}
            page={page}
            onPageChange={setPage}
        />
    );
};
