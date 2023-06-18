import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
    Input,
    Button,
    Textarea,
    Card,
    Switch,
    variables,
    SelectBar,
    Tooltip,
} from '@trezor/components';
import { InputError, WalletLayout, WalletLayoutHeader } from 'src/components/wallet';
import { CharacterCount, Translation } from 'src/components/suite';
import { useActions, useDevice, useSelector, useTranslation } from 'src/hooks/suite';
import * as signVerifyActions from 'src/actions/wallet/signVerifyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { Navigation, NavPages } from './components/Navigation';
import { SignAddressInput } from './components/SignAddressInput';
import { ButtonRow, Row } from './components/ButtonRow';
import { useCopySignedMessage } from 'src/hooks/wallet/sign-verify/useCopySignedMessage';
import {
    useSignVerifyForm,
    SignVerifyFields,
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
} from 'src/hooks/wallet/sign-verify/useSignVerifyForm';
import { getInputState } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';

const SwitchWrapper = styled.label`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    align-items: center;
    height: 100%;

    & > * + * {
        margin-left: 10px;
    }
`;

const Form = styled.form`
    padding: 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 42px 20px;
    }
`;

const FormatDescription = styled.p`
    span {
        font-weight: ${variables.FONT_WEIGHT.BOLD};
    }

    & + & {
        margin-top: 10px;
    }
`;

const StyledSelectBar = styled(SelectBar)`
    margin: 12px 0 20px;

    @media (min-width: ${variables.SCREEN_SIZE.SM}) {
        width: 320px;
        margin: 0 0 0 20px;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
        width: 100%;
        margin: 12px 0 20px;
    }

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        width: 320px;
        margin: 0 0 0 20px;
    }
`;

const Divider = styled.div`
    margin: 15px 0 30px;
    height: 1px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

const Copybutton = styled(Button)`
    position: absolute;
    right: 0;
    top: -2px;
`;

const SignVerify = () => {
    const { selectedAccount, revealedAddresses } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        revealedAddresses: state.wallet.receive,
    }));

    const [page, setPage] = useState<NavPages>('sign');
    const [isCompleted, setIsCompleted] = useState(false);

    const isSignPage = page === 'sign';

    const {
        isFormDirty,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        formSetSignature,
        messageRef,
        signatureRef,
        hexField,
        addressField,
        pathField,
        isElectrumField,
    } = useSignVerifyForm(isSignPage, selectedAccount.account as Account);

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const { canCopy, copy } = useCopySignedMessage(formValues, selectedAccount.network?.name);

    const { sign, verify, goto } = useActions({
        sign: signVerifyActions.sign,
        verify: signVerifyActions.verify,
        goto: routerActions.goto,
    });

    useEffect(() => {
        if (isSignPage && formValues.signature) return;

        setIsCompleted(false);
    }, [isSignPage, formValues.message, formValues.address, formValues.signature]);

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum } = data;

        if (isSignPage) {
            const result = await sign(path, message, hex, isElectrum);

            if (result) {
                formSetSignature(result);
                setIsCompleted(true);
            }
        } else {
            const result = await verify(address, message, signature, hex);

            if (result) setIsCompleted(true);
        }
    };

    const tooltipContent = (
        <Translation
            id="TR_FORMAT_TOOLTIP"
            values={{
                FormatDescription: chunks => <FormatDescription>{chunks}</FormatDescription>,
                span: chunks => <span>{chunks}</span>,
            }}
        />
    );

    const formatOptions = useMemo(
        () => [
            { value: false, label: <Translation id="TR_BIP_SIG_FORMAT" /> },
            {
                value: true,
                label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />,
            },
        ],
        [],
    );

    const closeScreen = useCallback(
        (withCopy?: boolean) => {
            if (withCopy) {
                copy();
            }

            goto('wallet-index', { preserveParams: true });
        },
        [copy, goto],
    );

    return (
        <WalletLayout title="TR_NAV_SIGN_VERIFY" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_SIGN_VERIFY">
                {isFormDirty && (
                    <Button type="button" variant="tertiary" onClick={resetForm}>
                        <Translation id="TR_CLEAR_ALL" />
                    </Button>
                )}
            </WalletLayoutHeader>

            <Card noPadding>
                <Navigation page={page} setPage={setPage} />

                <Form onSubmit={formSubmit(onSubmit)}>
                    <Row>
                        <Textarea
                            name="message"
                            label={<Translation id="TR_MESSAGE" />}
                            labelRight={
                                <SwitchWrapper>
                                    <Translation id="TR_HEX_FORMAT" />
                                    <Switch {...hexField} isSmall />
                                </SwitchWrapper>
                            }
                            innerRef={messageRef}
                            inputState={getInputState(formErrors.message, formValues.message)}
                            bottomText={<InputError error={formErrors.message} />}
                            rows={4}
                            maxRows={4}
                            data-test="@sign-verify/message"
                        >
                            <CharacterCount
                                current={formValues.message?.length || 0}
                                max={MAX_LENGTH_MESSAGE}
                            />
                        </Textarea>
                    </Row>

                    <Row>
                        {isSignPage ? (
                            <SignAddressInput
                                name="path"
                                label={<Translation id="TR_ADDRESS" />}
                                account={selectedAccount.account}
                                revealedAddresses={revealedAddresses}
                                inputState={getInputState(formErrors.path, formValues.path)}
                                bottomText={<InputError error={formErrors.path} />}
                                data-test="@sign-verify/sign-address"
                                {...pathField}
                            />
                        ) : (
                            <Input
                                name="address"
                                label={<Translation id="TR_ADDRESS" />}
                                type="text"
                                inputState={getInputState(formErrors.address, formValues.address)}
                                bottomText={<InputError error={formErrors.address} />}
                                data-test="@sign-verify/select-address"
                                {...addressField}
                            />
                        )}

                        {isSignPage && (
                            <StyledSelectBar
                                label={
                                    <Tooltip maxWidth={330} content={tooltipContent} dashed>
                                        <Translation id="TR_FORMAT" />
                                    </Tooltip>
                                }
                                options={formatOptions}
                                isInLine={false}
                                data-test="@sign-verify/format"
                                {...isElectrumField}
                            />
                        )}
                    </Row>

                    <Divider />

                    <Row>
                        {isSignPage ? (
                            <>
                                {canCopy && (
                                    <Copybutton
                                        type="button"
                                        variant="tertiary"
                                        onClick={copy}
                                        icon="COPY"
                                    >
                                        <Translation id="TR_COPY_SIGNED_MESSAGE" />
                                    </Copybutton>
                                )}

                                <Input
                                    name="signature"
                                    label={<Translation id="TR_SIGNATURE" />}
                                    maxLength={MAX_LENGTH_SIGNATURE}
                                    type="text"
                                    innerRef={signatureRef}
                                    readOnly={isSignPage}
                                    isDisabled={!formValues.signature?.length}
                                    inputState={getInputState(
                                        formErrors.signature,
                                        formValues.signature,
                                    )}
                                    bottomText={<InputError error={formErrors.signature} />}
                                    placeholder={translationString(
                                        'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
                                    )}
                                    data-test="@sign-verify/signature"
                                />
                            </>
                        ) : (
                            <Textarea
                                name="signature"
                                label={<Translation id="TR_SIGNATURE" />}
                                maxLength={MAX_LENGTH_SIGNATURE}
                                innerRef={signatureRef}
                                inputState={getInputState(
                                    formErrors.signature,
                                    formValues.signature,
                                )}
                                bottomText={<InputError error={formErrors.signature} />}
                                rows={4}
                                maxRows={4}
                                data-test="@sign-verify/signature"
                            >
                                <CharacterCount
                                    current={formValues.signature?.length || 0}
                                    max={MAX_LENGTH_SIGNATURE}
                                />
                            </Textarea>
                        )}
                    </Row>

                    <ButtonRow
                        isCompleted={isCompleted}
                        isSubmitting={isSubmitting}
                        isSignPage={isSignPage}
                        isTrezorLocked={isLocked()}
                        resetForm={resetForm}
                        closeScreen={closeScreen}
                    />
                </Form>
            </Card>
        </WalletLayout>
    );
};

export default SignVerify;
