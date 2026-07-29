import { type ReactNode, useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    Box,
    Button,
    Card,
    Column,
    Divider,
    Input,
    Row,
    SelectBar,
    Switch,
    Tabs,
    Textarea,
    Tooltip,
} from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { CheckIcon, CopyIcon } from '@trezor/icons';

import { SignAddressInput } from './SignAddressInput';
import { isVerifySupported, sign, verify } from './signVerifyActions';
import { useCopySignedMessage } from './useCopySignedMessage';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type SignVerifyFields,
    useSignVerifyForm,
} from './useSignVerifyForm';

type SignVerifyShellProps = {
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean | undefined;
    headingAction: ReactNode;
    children: ReactNode;
};

type SignVerifyProps = {
    account: Account;
    network?: Network;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
};

export const SignVerify = ({ account, network, renderShell }: SignVerifyProps) => {
    const [page, setPage] = useState<'sign' | 'verify'>('sign');
    const [isCompleted, setIsCompleted] = useState(false);

    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );
    const dispatch = useDispatch();

    const isSignPage = page === 'sign';

    const {
        register,
        isFormDirty,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        formSetSignature,
        hexField,
        addressField,
        pathField,
        isElectrumField,
        cardanoPubKeyCoseField,
    } = useSignVerifyForm(isSignPage, account);

    const { isLocked, device } = useDevice();
    const { translationString } = useTranslation();
    const { canCopy, copy } = useCopySignedMessage(formValues, network);

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const messageError = getErrorMessage(formErrors.message);
    const pathError = getErrorMessage(formErrors.path);
    const addressError = getErrorMessage(formErrors.address);
    const signatureError = getErrorMessage(formErrors.signature);
    const pubKeyError = getErrorMessage(formErrors.pubKey);

    const { ref: messageRef, ...messageField } = register('message');
    const { ref: signatureRef, ...signatureField } = register('signature');
    const { ref: pubKeyRef, ...pubKeyField } = register('pubKey');

    const signatureProps = {
        label: translationString('TR_SIGNATURE'),
        hasError: !!formErrors.signature,
        bottomText: signatureError,
        'data-testid': '@sign-verify/signature',
        innerRef: signatureRef,
        ...signatureField,
    };
    const pubKeyProps = {
        label: translationString('TR_PUBLIC_KEY'),
        hasError: !!formErrors.pubKey,
        bottomText: pubKeyError,
        'data-testid': '@sign-verify/pubKey',
        innerRef: pubKeyRef,
        ...pubKeyField,
    };

    useEffect(() => {
        if (isSignPage && formValues.signature) return;

        setIsCompleted(false);
    }, [isSignPage, formValues.message, formValues.address, formValues.signature]);

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum, cardanoPubKeyCose } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                sign(account, path, message, hex, isElectrum, cardanoPubKeyCose),
            );

            if (result) {
                formSetSignature(result);
                setIsCompleted(true);
            }
        } else if (signature !== undefined) {
            const result = await dispatch(verify(account, address, message, signature, hex));

            if (result) setIsCompleted(true);
        }
    };

    const isDeviceConnected = device?.connected && device?.available;

    // Empty accountTypes means there is only 'normal' accountType and therefore the signatures are same.
    const signFormatsDiffer =
        account.networkType === 'bitcoin' &&
        account.accountType !== 'legacy' &&
        Object.keys(network?.accountTypes ?? {}).length >= 1;
    const canVerify = isVerifySupported(account);
    const isCardano = network?.networkType === 'cardano';

    return renderShell({
        title: canVerify ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE',
        isDeviceConnected,
        headingAction: isFormDirty ? (
            <Button
                type="button"
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={resetForm}
            >
                <Translation id="TR_CLEAR_ALL" />
            </Button>
        ) : null,
        children: (
            <Card>
                <Tabs activeItemId={page} size="large" margin={{ bottom: 20 }}>
                    <Tabs.Item
                        id="sign"
                        onClick={() => setPage('sign')}
                        data-testid="@sign-verify/navigation/sign"
                    >
                        <Translation id="TR_SIGN" />
                    </Tabs.Item>
                    {canVerify && (
                        <Tabs.Item
                            id="verify"
                            onClick={() => setPage('verify')}
                            data-testid="@sign-verify/navigation/verify"
                        >
                            <Translation id="TR_VERIFY" />
                        </Tabs.Item>
                    )}
                </Tabs>
                <form onSubmit={formSubmit(onSubmit)}>
                    <Column gap={16} margin={{ bottom: 32 }}>
                        <Textarea
                            labelLeft={<Translation id="TR_MESSAGE" />}
                            labelRight={
                                <Switch
                                    label={<Translation id="TR_HEX_FORMAT" />}
                                    labelPosition="start"
                                    size="small"
                                    {...hexField}
                                />
                            }
                            hasError={!!formErrors.message}
                            characterCount={{
                                current: formValues.message?.length,
                                max: MAX_LENGTH_MESSAGE,
                            }}
                            bottomText={messageError || null}
                            rows={4}
                            data-testid="@sign-verify/message"
                            innerRef={messageRef}
                            {...messageField}
                        />
                        {isSignPage ? (
                            <>
                                <Row gap={40} alignItems="flex-start">
                                    <Box flex="1" minWidth={0}>
                                        <SignAddressInput
                                            name="path"
                                            label={<Translation id="TR_ADDRESS" />}
                                            account={account}
                                            touchedAddresses={touchedAddresses}
                                            hasError={!!formErrors.path}
                                            bottomText={pathError || null}
                                            data-testid="@sign-verify/sign-address"
                                            {...pathField}
                                        />
                                    </Box>
                                    {signFormatsDiffer && (
                                        <SelectBar
                                            label={
                                                <Tooltip
                                                    maxWidth={330}
                                                    content={
                                                        <Translation
                                                            id="TR_FORMAT_TOOLTIP"
                                                            values={{
                                                                FormatDescription: chunks => (
                                                                    <p>{chunks}</p>
                                                                ),
                                                                span: chunks => (
                                                                    <strong>{chunks}</strong>
                                                                ),
                                                            }}
                                                        />
                                                    }
                                                    hasIcon
                                                >
                                                    <Translation id="TR_FORMAT" />
                                                </Tooltip>
                                            }
                                            options={[
                                                {
                                                    value: false,
                                                    label: <Translation id="TR_BIP_SIG_FORMAT" />,
                                                },
                                                {
                                                    value: true,
                                                    label: (
                                                        <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />
                                                    ),
                                                },
                                            ]}
                                            data-testid="@sign-verify/format"
                                            {...isElectrumField}
                                        />
                                    )}
                                </Row>
                                {isCardano && (
                                    <SelectBar
                                        label={<Translation id="TR_PUBLIC_KEY_FORMAT" />}
                                        options={[
                                            {
                                                value: false,
                                                label: <Translation id="TR_PUBLIC_KEY_RAW" />,
                                            },
                                            {
                                                value: true,
                                                label: <Translation id="TR_PUBLIC_KEY_COSE" />,
                                            },
                                        ]}
                                        data-testid="@sign-verify/cardano-pubkey-format"
                                        {...cardanoPubKeyCoseField}
                                    />
                                )}
                                <Divider margin={{}} />
                                <Input
                                    maxLength={MAX_LENGTH_SIGNATURE}
                                    type="text"
                                    readOnly={isSignPage}
                                    isDisabled={!formValues.signature?.length}
                                    placeholder={translationString(
                                        'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                    )}
                                    rightContent={
                                        canCopy ? (
                                            <Button
                                                type="button"
                                                intent="neutral"
                                                priority="secondary"
                                                onClick={copy}
                                                iconLeft={CopyIcon}
                                                size="small"
                                            >
                                                <Translation
                                                    id={
                                                        isCardano
                                                            ? 'TR_COPY_TO_CLIPBOARD'
                                                            : 'TR_COPY_SIGNED_MESSAGE'
                                                    }
                                                />
                                            </Button>
                                        ) : undefined
                                    }
                                    {...signatureProps}
                                />
                                {isCardano && (
                                    <Input
                                        type="text"
                                        readOnly={isSignPage}
                                        isDisabled={!formValues.pubKey?.length}
                                        placeholder={translationString(
                                            'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                        )}
                                        rightContent={
                                            canCopy ? (
                                                <Button
                                                    type="button"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    onClick={() =>
                                                        copyToClipboard(formValues.pubKey || '')
                                                    }
                                                    iconLeft={CopyIcon}
                                                    size="small"
                                                >
                                                    <Translation id="TR_COPY_TO_CLIPBOARD" />
                                                </Button>
                                            ) : undefined
                                        }
                                        {...pubKeyProps}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <Input
                                    name="address"
                                    label={<Translation id="TR_ADDRESS" />}
                                    type="text"
                                    hasError={!!formErrors.address}
                                    bottomText={addressError || null}
                                    data-testid="@sign-verify/select-address"
                                    {...addressField}
                                />
                                <Textarea
                                    maxLength={MAX_LENGTH_SIGNATURE}
                                    characterCount={{
                                        current: formValues.signature?.length,
                                        max: MAX_LENGTH_SIGNATURE,
                                    }}
                                    rows={4}
                                    {...signatureProps}
                                />
                            </>
                        )}
                    </Column>
                    <Button
                        type="submit"
                        intent="brand"
                        iconLeft={isCompleted ? CheckIcon : undefined}
                        priority={isCompleted ? 'secondary' : 'primary'}
                        isDisabled={isLocked()}
                        isLoading={isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        {isSignPage ? (
                            <Translation id={isCompleted ? 'TR_SIGNED' : 'TR_SIGN'} />
                        ) : (
                            <Translation id={isCompleted ? 'TR_VERIFIED' : 'TR_VERIFY'} />
                        )}
                    </Button>
                </form>
            </Card>
        ),
    });
};
