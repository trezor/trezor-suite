import { type ReactNode, useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    Badge,
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
    Text,
    Textarea,
    Tooltip,
} from '@trezor/components';
import { CheckCircleIcon, CopyIcon, WarningCircleIcon } from '@trezor/icons';

import { SignAddressInput } from './SignAddressInput';
import { isVerifySupported, sign, verify } from './signVerifyActions';
import { useCopyValue } from './useCopyValue';
import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type SignVerifyFields,
    useSignVerifyForm,
} from './useSignVerifyForm';

type CopyFieldButtonProps = {
    onClick: () => void;
    'data-testid': string;
};

const CopyFieldButton = ({ onClick, 'data-testid': dataTestId }: CopyFieldButtonProps) => (
    <Button
        type="button"
        intent="brand"
        priority="secondary"
        size="small"
        iconLeft={CopyIcon}
        onClick={onClick}
        data-testid={dataTestId}
    >
        <Translation id="TR_COPY_TO_CLIPBOARD" />
    </Button>
);

type Outcome = 'idle' | 'signed' | 'verified' | 'failed';

const outcomeBadges = {
    signed: { intent: 'brand', icon: CheckCircleIcon, labelId: 'TR_SIGNED_MESSAGE_BADGE' },
    verified: { intent: 'brand', icon: CheckCircleIcon, labelId: 'TR_VERIFIED_MESSAGE_BADGE' },
    failed: {
        intent: 'critical',
        icon: WarningCircleIcon,
        labelId: 'TR_VERIFICATION_FAILED_BADGE',
    },
} as const satisfies Record<Exclude<Outcome, 'idle'>, unknown>;

const OutcomeBadge = ({ outcome }: { outcome: Exclude<Outcome, 'idle'> }) => {
    const { intent, icon, labelId } = outcomeBadges[outcome];

    return (
        <Badge intent={intent} iconRight={icon} data-testid={`@sign-verify/outcome/${outcome}`}>
            <Translation id={labelId} />
        </Badge>
    );
};

const FIELD_PADDING = 16;

const TABS_LABEL_BOTTOM_SPACE = 10;

const FORMAT_SWITCH_WIDTH = 360;

type FormatSwitchProps = {
    options: { value: boolean; label: ReactNode }[];
    selectedOption?: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean;
    tooltip?: ReactNode;
    'data-testid': string;
};

const FormatSwitch = ({
    options,
    tooltip,
    isDisabled,
    'data-testid': dataTestId,
    ...field
}: FormatSwitchProps) => {
    const label = (
        <Text case="capitalize" intent="neutral" priority="secondary" typographyStyle="body-md">
            <Translation id="TR_FORMAT" />
        </Text>
    );

    return (
        <Row gap={12}>
            {tooltip ? (
                <Tooltip maxWidth={330} content={tooltip} hasIcon>
                    {label}
                </Tooltip>
            ) : (
                label
            )}
            <Box width={FORMAT_SWITCH_WIDTH}>
                <SelectBar
                    isFullWidth
                    isDisabled={isDisabled}
                    options={options}
                    data-testid={dataTestId}
                    {...field}
                />
            </Box>
        </Row>
    );
};

type SignVerifyShellProps = {
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean | undefined;
    children: ReactNode;
};

type SignVerifyProps = {
    account: Account;
    network?: Network;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
};

export const SignVerify = ({ account, network, renderShell }: SignVerifyProps) => {
    const [page, setPage] = useState<'sign' | 'verify'>('sign');
    const [outcome, setOutcome] = useState<Outcome>('idle');

    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );
    const dispatch = useDispatch();

    const isSignPage = page === 'sign';

    const {
        register,
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
    const copyValue = useCopyValue();

    const isCompleted = outcome === 'signed' || outcome === 'verified';

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

    const hasFailedVerification = outcome === 'failed';

    const signatureProps = {
        label: translationString('TR_SIGNATURE'),
        hasError: !!formErrors.signature || hasFailedVerification,
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

    // Signing writes the signature itself, so the Sign page must not watch it.
    const outcomeInputs = isSignPage
        ? [formValues.message, formValues.address, formValues.hex]
        : [formValues.message, formValues.address, formValues.signature, formValues.hex];

    useEffect(() => {
        setOutcome('idle');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSignPage, outcomeInputs.join('\u0000')]);

    const renderAddressField = () => {
        if (isCompleted) {
            return (
                <Input
                    label={<Translation id="TR_ADDRESS" />}
                    type="text"
                    readOnly
                    value={formValues.address ?? ''}
                    rightContent={
                        <CopyFieldButton
                            onClick={() => copyValue(formValues.address || '')}
                            data-testid="@sign-verify/copy-address"
                        />
                    }
                    data-testid="@sign-verify/submitted-address"
                />
            );
        }

        if (isSignPage) {
            return (
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
            );
        }

        return (
            <Input
                name="address"
                label={<Translation id="TR_ADDRESS" />}
                type="text"
                hasError={!!formErrors.address || hasFailedVerification}
                bottomText={addressError || null}
                data-testid="@sign-verify/select-address"
                {...addressField}
            />
        );
    };

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum, cardanoPubKeyCose } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                sign(account, path, message, hex, isElectrum, cardanoPubKeyCose),
            );

            if (result) {
                formSetSignature(result);
                setOutcome('signed');
            }
        } else if (signature !== undefined) {
            const result = await dispatch(verify(account, address, message, signature, hex));

            setOutcome(result ? 'verified' : 'failed');
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
        children: (
            <Card>
                <Box position={{ type: 'relative' }} margin={{ bottom: 20 }}>
                    <Tabs activeItemId={page} size="large">
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
                    {outcome !== 'idle' && (
                        <Row
                            position={{
                                type: 'absolute',
                                top: 0,
                                right: 0,
                                bottom: TABS_LABEL_BOTTOM_SPACE,
                            }}
                        >
                            <OutcomeBadge outcome={outcome} />
                        </Row>
                    )}
                </Box>
                <form onSubmit={formSubmit(onSubmit)}>
                    <Column gap={16} margin={{ bottom: 32 }}>
                        {isSignPage && signFormatsDiffer && !isCompleted && (
                            <FormatSwitch
                                options={[
                                    {
                                        value: true,
                                        label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />,
                                    },
                                    { value: false, label: <Translation id="TR_BIP_SIG_FORMAT" /> },
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
                                {...isElectrumField}
                            />
                        )}
                        {isSignPage && isCardano && (
                            <FormatSwitch
                                options={[
                                    { value: false, label: <Translation id="TR_PUBLIC_KEY_RAW" /> },
                                    { value: true, label: <Translation id="TR_PUBLIC_KEY_COSE" /> },
                                ]}
                                isDisabled={isCompleted}
                                data-testid="@sign-verify/cardano-pubkey-format"
                                {...cardanoPubKeyCoseField}
                            />
                        )}
                        {renderAddressField()}
                        <Box position={{ type: 'relative' }}>
                            <Textarea
                                label={<Translation id="TR_MESSAGE" />}
                                readOnly={isCompleted}
                                hasError={!!formErrors.message || hasFailedVerification}
                                characterCount={
                                    isCompleted
                                        ? undefined
                                        : {
                                              current: formValues.message?.length,
                                              max: MAX_LENGTH_MESSAGE,
                                          }
                                }
                                bottomText={messageError || null}
                                rows={4}
                                data-testid="@sign-verify/message"
                                innerRef={messageRef}
                                {...messageField}
                            />
                            <Box
                                position={{
                                    type: 'absolute',
                                    top: FIELD_PADDING,
                                    right: FIELD_PADDING,
                                }}
                            >
                                {isCompleted ? (
                                    <CopyFieldButton
                                        onClick={() => copyValue(formValues.message || '')}
                                        data-testid="@sign-verify/copy-message"
                                    />
                                ) : (
                                    <Switch
                                        label={<Translation id="TR_HEX_FORMAT" />}
                                        labelPosition="start"
                                        {...hexField}
                                    />
                                )}
                            </Box>
                        </Box>
                        {isSignPage && <Divider margin={{}} />}
                        <Input
                            maxLength={MAX_LENGTH_SIGNATURE}
                            type="text"
                            readOnly={isSignPage || isCompleted}
                            isDisabled={isSignPage && !formValues.signature?.length}
                            placeholder={
                                isSignPage
                                    ? translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')
                                    : undefined
                            }
                            rightContent={
                                isCompleted ? (
                                    <CopyFieldButton
                                        onClick={() => copyValue(formValues.signature || '')}
                                        data-testid="@sign-verify/copy-signature"
                                    />
                                ) : undefined
                            }
                            {...signatureProps}
                        />
                        {isSignPage && isCardano && (
                            <Input
                                type="text"
                                readOnly
                                isDisabled={!formValues.pubKey?.length}
                                placeholder={translationString(
                                    'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                )}
                                rightContent={
                                    isCompleted ? (
                                        <CopyFieldButton
                                            onClick={() => copyValue(formValues.pubKey || '')}
                                            data-testid="@sign-verify/copy-pubkey"
                                        />
                                    ) : undefined
                                }
                                {...pubKeyProps}
                            />
                        )}
                    </Column>
                    {outcome === 'signed' || outcome === 'verified' ? (
                        <Button
                            type="button"
                            intent="neutral"
                            priority="secondary"
                            onClick={resetForm}
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
        ),
    });
};
