import { useEffect, useState } from 'react';
import { FieldError } from 'react-hook-form';

import { getInputState } from '@suite-common/wallet-utils';
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
import { spacings } from '@trezor/theme';

import { sign, verify } from 'src/actions/wallet/signVerifyActions';
import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';
import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useDevice, useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useCopySignedMessage } from 'src/hooks/wallet/sign-verify/useCopySignedMessage';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    SignVerifyFields,
    useSignVerifyForm,
} from 'src/hooks/wallet/sign-verify/useSignVerifyForm';

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
    } = useSignVerifyForm(isSignPage, selectedAccount.account!);

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const { canCopy, copy } = useCopySignedMessage(formValues, selectedAccount.network?.name);

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
        inputState: getInputState(formErrors.signature) as ReturnType<typeof getInputState>,
        bottomText: signatureError,
        'data-testid': '@sign-verify/signature',
        innerRef: signatureRef,
        ...signatureField,
    };

    useEffect(() => {
        if (isSignPage && formValues.signature) return;

        setIsCompleted(false);
    }, [isSignPage, formValues.message, formValues.address, formValues.signature]);

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(sign(path, message, hex, isElectrum));

            if (result) {
                formSetSignature(result);
                setIsCompleted(true);
            }
        } else if (signature !== undefined) {
            const result = await dispatch(verify(address, message, signature, hex));

            if (result) setIsCompleted(true);
        }
    };

    return (
        <WalletLayout title="TR_NAV_SIGN_VERIFY" isSubpage account={selectedAccount}>
            <WalletSubpageHeading title="TR_NAV_SIGN_VERIFY">
                {isFormDirty && (
                    <Button type="button" size="small" variant="tertiary" onClick={resetForm}>
                        <Translation id="TR_CLEAR_ALL" />
                    </Button>
                )}
            </WalletSubpageHeading>

            <Card>
                <Tabs activeItemId={page} size="large" margin={{ bottom: spacings.lg }}>
                    <Tabs.Item id="sign" onClick={() => setPage('sign')}>
                        <Translation id="TR_SIGN" />
                    </Tabs.Item>
                    <Tabs.Item id="verify" onClick={() => setPage('verify')}>
                        <Translation id="TR_VERIFY" />
                    </Tabs.Item>
                </Tabs>
                <form onSubmit={formSubmit(onSubmit)}>
                    <Column gap={spacings.md} margin={{ bottom: spacings.xxl }}>
                        <Textarea
                            labelLeft={<Translation id="TR_MESSAGE" />}
                            labelRight={
                                <Switch
                                    label={<Translation id="TR_HEX_FORMAT" />}
                                    labelPosition="start"
                                    {...hexField}
                                />
                            }
                            inputState={getInputState(formErrors.message)}
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
                                        inputState={getInputState(formErrors.path)}
                                        bottomText={pathError || null}
                                        data-testid="@sign-verify/sign-address"
                                        {...pathField}
                                    />
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
                                </Row>
                                <Divider margin={{}} />
                                <Input
                                    maxLength={MAX_LENGTH_SIGNATURE}
                                    type="text"
                                    readOnly={isSignPage}
                                    isDisabled={!formValues.signature?.length}
                                    placeholder={translationString(
                                        'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                    )}
                                    innerAddon={
                                        canCopy ? (
                                            <Button
                                                type="button"
                                                variant="tertiary"
                                                onClick={copy}
                                                icon="copy"
                                                size="tiny"
                                            >
                                                <Translation id="TR_COPY_SIGNED_MESSAGE" />
                                            </Button>
                                        ) : undefined
                                    }
                                    {...signatureProps}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    name="address"
                                    label={<Translation id="TR_ADDRESS" />}
                                    type="text"
                                    inputState={getInputState(formErrors.address)}
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
                        variant="primary"
                        icon={isCompleted ? 'check' : undefined}
                        isSubtle={isCompleted}
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
