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

type CopyFieldButtonProps = {
    labelId: TranslationKey;
    onClick: () => void;
    isDisabled: boolean;
    'data-testid': string;
};

const CopyFieldButton = ({
    labelId,
    onClick,
    isDisabled,
    'data-testid': dataTestId,
}: CopyFieldButtonProps) => (
    <Tooltip
        content={isDisabled ? <Translation id="TR_NOTHING_TO_COPY" /> : undefined}
        cursor={isDisabled ? 'not-allowed' : undefined}
    >
        {/* A disabled button dispatches no mouse events, so the pointer has to reach the tooltip. */}
        <Box pointerEvents={isDisabled ? 'none' : undefined}>
            <Button
                type="button"
                intent="neutral"
                priority="secondary"
                size="small"
                iconLeft={CopyIcon}
                onClick={onClick}
                isDisabled={isDisabled}
                data-testid={dataTestId}
            >
                <Translation id={labelId} />
            </Button>
        </Box>
    </Tooltip>
);

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
    const { canCopy, signedMessage, copyValue, copySignature, copySignedMessage } =
        useCopySignedMessage(formValues, network);

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
                                <Row gap={12}>
                                    <Switch
                                        label={<Translation id="TR_HEX_FORMAT" />}
                                        labelPosition="start"
                                        size="small"
                                        {...hexField}
                                    />
                                    {isSignPage && (
                                        <CopyFieldButton
                                            labelId="TR_COPY_TO_CLIPBOARD"
                                            onClick={() => copyValue(formValues.message || '')}
                                            isDisabled={!formValues.message}
                                            data-testid="@sign-verify/copy-message"
                                        />
                                    )}
                                </Row>
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
                                            labelRight={
                                                <CopyFieldButton
                                                    labelId="TR_COPY_TO_CLIPBOARD"
                                                    onClick={() =>
                                                        copyValue(formValues.address || '')
                                                    }
                                                    isDisabled={!formValues.address}
                                                    data-testid="@sign-verify/copy-address"
                                                />
                                            }
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
                                        <CopyFieldButton
                                            labelId="TR_COPY_SIGNATURE"
                                            onClick={copySignature}
                                            isDisabled={!formValues.signature}
                                            data-testid="@sign-verify/copy-signature"
                                        />
                                    }
                                    {...signatureProps}
                                />
                                {signedMessage !== null && (
                                    <Textarea
                                        labelLeft={<Translation id="TR_SIGNED_MESSAGE" />}
                                        labelRight={
                                            <CopyFieldButton
                                                labelId="TR_COPY_SIGNED_MESSAGE"
                                                onClick={copySignedMessage}
                                                isDisabled={!canCopy}
                                                data-testid="@sign-verify/copy-signed-message"
                                            />
                                        }
                                        readOnly
                                        isDisabled={!canCopy}
                                        value={canCopy ? signedMessage : ''}
                                        placeholder={translationString(
                                            'TR_SIGNED_MESSAGE_AFTER_SIGNING_PLACEHOLDER',
                                        )}
                                        rows={7}
                                        data-testid="@sign-verify/signed-message"
                                    />
                                )}
                                {isCardano && (
                                    <Input
                                        type="text"
                                        readOnly={isSignPage}
                                        isDisabled={!formValues.pubKey?.length}
                                        placeholder={translationString(
                                            'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                        )}
                                        rightContent={
                                            <CopyFieldButton
                                                labelId="TR_COPY_TO_CLIPBOARD"
                                                onClick={() => copyValue(formValues.pubKey || '')}
                                                isDisabled={!formValues.pubKey}
                                                data-testid="@sign-verify/copy-pubkey"
                                            />
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
