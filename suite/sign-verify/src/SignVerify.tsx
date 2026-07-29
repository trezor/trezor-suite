import { useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import {
    Box,
    Button,
    Card,
    Column,
    Divider,
    Input,
    Row,
    Switch,
    Tabs,
    Textarea,
} from '@trezor/components';
import { CheckIcon, CopyIcon } from '@trezor/icons';

import { SignAddressInput } from './SignAddressInput';
import { sign, verify } from './signVerifyActions';
import type { SignVerifyNetworkConfig, SignVerifyProps } from './types';
import { useCopySignedMessage } from './useCopySignedMessage';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type SignVerifyFields,
    useSignVerifyForm,
} from './useSignVerifyForm';

type SignVerifyComponentProps = SignVerifyProps & {
    networkConfig: SignVerifyNetworkConfig;
};

export const SignVerify = ({
    account,
    network,
    networkConfig,
    renderShell,
}: SignVerifyComponentProps) => {
    const [page, setPage] = useState<'sign' | 'verify'>('sign');
    const [isCompleted, setIsCompleted] = useState(false);
    const [additionalResult, setAdditionalResult] = useState('');

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
        signOptionField,
    } = useSignVerifyForm(isSignPage, account, networkConfig);

    const { isLocked, device } = useDevice();
    const { translationString } = useTranslation();
    const { canCopy, copy } = useCopySignedMessage(
        formValues,
        networkConfig.formatSignedMessage,
        network,
    );

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const messageError = getErrorMessage(formErrors.message);
    const pathError = getErrorMessage(formErrors.path);
    const addressError = getErrorMessage(formErrors.address);
    const signatureError = getErrorMessage(formErrors.signature);

    const { ref: messageRef, ...messageField } = register('message');
    const { ref: signatureRef, ...signatureField } = register('signature');

    const signatureProps = {
        label: translationString('TR_SIGNATURE'),
        hasError: !!formErrors.signature,
        bottomText: signatureError,
        'data-testid': '@sign-verify/signature',
        innerRef: signatureRef,
        ...signatureField,
    };

    useEffect(() => {
        if (isSignPage && formValues.signature) return;

        setIsCompleted(false);
    }, [isSignPage, formValues.message, formValues.address, formValues.signature]);

    useEffect(() => {
        if (isSignPage) {
            setAdditionalResult('');
        }
    }, [account.key, isSignPage, formValues.address, formValues.message, formValues.signOption]);

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, signOption } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                sign(networkConfig, account, path, message, hex, signOption),
            );

            if (result) {
                formSetSignature(result);
                setAdditionalResult(result.additionalResult ?? '');
                setIsCompleted(true);
            }
        } else if (signature !== undefined) {
            const result = await dispatch(
                verify(networkConfig, account, address, message, signature, hex),
            );

            if (result) setIsCompleted(true);
        }
    };

    const reset = () => {
        resetForm();
        setAdditionalResult('');
    };

    const isDeviceConnected = device?.connected && device?.available;
    const canVerify = networkConfig.verify !== undefined;
    const { SignAddressOptions } = networkConfig;
    const { SignOptions } = networkConfig;
    const { SignAdditionalResult } = networkConfig;

    return renderShell({
        title: canVerify ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE',
        isDeviceConnected,
        headingAction: isFormDirty ? (
            <Button
                type="button"
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={reset}
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
                                            getSignAddresses={networkConfig.getSignAddresses}
                                            hasError={!!formErrors.path}
                                            bottomText={pathError || null}
                                            data-testid="@sign-verify/sign-address"
                                            {...pathField}
                                        />
                                    </Box>
                                    {SignAddressOptions && (
                                        <SignAddressOptions
                                            account={account}
                                            network={network}
                                            field={signOptionField}
                                        />
                                    )}
                                </Row>
                                {SignOptions && (
                                    <SignOptions
                                        account={account}
                                        network={network}
                                        field={signOptionField}
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
                                                        networkConfig.copyButtonTranslationId ??
                                                        'TR_COPY_SIGNED_MESSAGE'
                                                    }
                                                />
                                            </Button>
                                        ) : undefined
                                    }
                                    {...signatureProps}
                                />
                                {SignAdditionalResult && (
                                    <SignAdditionalResult
                                        value={additionalResult}
                                        canCopy={Boolean(canCopy)}
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
