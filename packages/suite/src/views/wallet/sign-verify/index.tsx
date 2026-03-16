import { useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
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
import { spacings } from '@trezor/theme';

import { isVerifySupported, sign, verify } from 'src/actions/wallet/signVerifyActions';
import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useCopySignedMessage } from 'src/hooks/wallet/sign-verify/useCopySignedMessage';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type SignVerifyFields,
    useSignVerifyForm,
} from 'src/hooks/wallet/sign-verify/useSignVerifyForm';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { SignAddressInput } from './components/SignAddressInput';

const SignVerify = () => {
    const [page, setPage] = useState<'sign' | 'verify'>('sign');
    const [isCompleted, setIsCompleted] = useState(false);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const revealedAddresses = useSelector(state => state.wallet.receive);
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
    } = useSignVerifyForm(isSignPage, selectedAccount.account!);

    const { isLocked, device } = useDevice();
    const { translationString } = useTranslation();
    const { canCopy, copy } = useCopySignedMessage(formValues, selectedAccount.network);

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
            const result = await dispatch(sign(path, message, hex, isElectrum, cardanoPubKeyCose));

            if (result) {
                formSetSignature(result);
                setIsCompleted(true);
            }
        } else if (signature !== undefined) {
            const result = await dispatch(verify(address, message, signature, hex));

            if (result) setIsCompleted(true);
        }
    };

    const isDeviceConnected = device?.connected && device?.available;

    // Empty accountTypes means there is only 'normal' accountType and therefore the signatures are same.
    const signFormatsDiffer =
        selectedAccount.account?.networkType === 'bitcoin' &&
        selectedAccount.account?.accountType !== 'legacy' &&
        Object.keys(selectedAccount.network?.accountTypes ?? {}).length >= 1;
    const canVerify = isVerifySupported(selectedAccount.account);
    const isCardano = selectedAccount.network?.networkType === 'cardano';

    return (
        <WalletLayout
            title={canVerify ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE'}
            isSubpage
            account={selectedAccount}
        >
            <WalletSubpageHeading title={canVerify ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE'}>
                {isFormDirty && (
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={resetForm}
                    >
                        <Translation id="TR_CLEAR_ALL" />
                    </Button>
                )}
            </WalletSubpageHeading>

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <Card>
                <Tabs activeItemId={page} size="large" margin={{ bottom: spacings.lg }}>
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
                    <Column gap={spacings.md} margin={{ bottom: spacings.xxl }}>
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
                                <Row gap={spacings.xxxl}>
                                    <SignAddressInput
                                        name="path"
                                        label={<Translation id="TR_ADDRESS" />}
                                        account={selectedAccount.account}
                                        revealedAddresses={revealedAddresses}
                                        hasError={!!formErrors.path}
                                        bottomText={pathError || null}
                                        data-testid="@sign-verify/sign-address"
                                        {...pathField}
                                    />
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
                                                iconLeft="copy"
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
                                                    iconLeft="copy"
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
                        iconLeft={isCompleted ? 'check' : undefined}
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
        </WalletLayout>
    );
};

export default SignVerify;
