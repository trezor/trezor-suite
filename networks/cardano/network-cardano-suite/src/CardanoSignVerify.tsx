import { useState } from 'react';
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
    SignVerifyPubKeyField,
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
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';

import { type CardanoSignVerifyActions } from './cardanoSignVerifyActions';
import { getCardanoSignAddresses } from './getCardanoSignAddresses';

type CardanoAccount = AccountWithNetworkType<'cardano'>;

type CardanoSignVerifyFields = SignVerifyBaseFields & {
    pubKey?: string;
    cardanoPubKeyCose?: boolean;
};

const cardanoSignVerifySchema: yup.ObjectSchema<CardanoSignVerifyFields> = yup.object({
    ...signVerifyBaseSchema,
    pubKey: yup.string(),
    cardanoPubKeyCose: yup.boolean(),
});

const DEFAULT_VALUES: CardanoSignVerifyFields = {
    ...SIGN_VERIFY_BASE_DEFAULT_VALUES,
    pubKey: '',
    cardanoPubKeyCose: false,
};

type CardanoSignVerifyFormProps = {
    account: CardanoAccount;
    actions: CardanoSignVerifyActions;
    page: SignVerifyPage;
    onPageChange: (page: SignVerifyPage) => void;
};

const CardanoSignVerifyForm = ({
    account,
    actions,
    page,
    onPageChange,
}: CardanoSignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const { dispatch } = useServices(selectDispatch);

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
    } = useSignVerifyForm<CardanoSignVerifyFields>({
        account,
        isSignPage: true,
        schema: cardanoSignVerifySchema,
        defaultValues: DEFAULT_VALUES,
        resultFields: ['signature', 'pubKey'],
        signedInputFields: ['address', 'message', 'cardanoPubKeyCose'],
    });

    const { field: cardanoPubKeyCoseField } = useController({
        control,
        name: 'cardanoPubKeyCose',
    });

    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const isCompleted = outcome === 'signed';

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        resetForm();
        setOutcome('idle');
    };

    const onSubmit = async (data: CardanoSignVerifyFields) => {
        const { path, message, hex, cardanoPubKeyCose } = data;

        if (path === undefined) {
            return;
        }

        const result = await dispatch(
            actions.signThunk(account, path, message, hex, cardanoPubKeyCose),
        );

        if (result) {
            setValue('signature', result.signature);
            setValue('pubKey', result.pubKey || '');
            setOutcome('signed');
        }
    };

    return (
        <Card>
            <SignVerifyTabs
                page={page}
                canVerify={false}
                outcome={outcome}
                onPageChange={onPageChange}
            />
            <form onSubmit={formSubmit(onSubmit)}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    <FormatSwitch
                        options={[
                            { value: false, label: <Translation id="TR_PUBLIC_KEY_RAW" /> },
                            { value: true, label: <Translation id="TR_PUBLIC_KEY_COSE" /> },
                        ]}
                        isDisabled={isCompleted}
                        data-testid="@sign-verify/cardano-pubkey-format"
                        selectedOption={cardanoPubKeyCoseField.value}
                        onChange={cardanoPubKeyCoseField.onChange}
                    />
                    <SignVerifyAddressField
                        account={account}
                        signAddresses={getCardanoSignAddresses(account, touchedAddresses)}
                        isSignPage
                        isCompleted={isCompleted}
                        address={formValues.address}
                        pathField={pathField}
                        addressField={addressField}
                        pathError={getErrorMessage(formErrors.path)}
                        addressError={getErrorMessage(formErrors.address)}
                        hasPathError={!!formErrors.path}
                        hasAddressError={!!formErrors.address}
                        onCopy={copyValue}
                    />
                    <SignVerifyMessageField
                        message={formValues.message}
                        isCompleted={isCompleted}
                        hasError={!!formErrors.message}
                        errorMessage={getErrorMessage(formErrors.message)}
                        hexField={hexField}
                        registration={register('message')}
                        onCopy={copyValue}
                    />
                    <SignVerifySignatureField
                        signature={formValues.signature}
                        isSignPage
                        isCompleted={isCompleted}
                        hasError={!!formErrors.signature}
                        errorMessage={getErrorMessage(formErrors.signature)}
                        registration={register('signature')}
                        onCopy={copyValue}
                    />
                    <SignVerifyPubKeyField
                        pubKey={formValues.pubKey}
                        isCompleted={isCompleted}
                        hasError={!!formErrors.pubKey}
                        errorMessage={getErrorMessage(formErrors.pubKey)}
                        registration={register('pubKey')}
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
                        <Translation id="TR_SIGN" />
                    </Button>
                )}
            </form>
        </Card>
    );
};

type CardanoSignVerifyComponentProps = SignVerifyProps & {
    actions: CardanoSignVerifyActions;
};

export const CardanoSignVerify = ({ account, actions }: CardanoSignVerifyComponentProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    return (
        // Each tab of each account is a form of its own: keying it throws away everything the
        // previous one was in the middle of, including the outcome it had reached.
        <CardanoSignVerifyForm
            key={`${page}-${account.key}`}
            account={account as CardanoAccount}
            actions={actions}
            page={page}
            onPageChange={setPage}
        />
    );
};
