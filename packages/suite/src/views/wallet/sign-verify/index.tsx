import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
    Input,
    Button,
    Textarea,
    Card,
    Switch,
    variables,
    Icon,
    useTheme,
} from '@trezor/components';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { CharacterCount, Translation } from '@suite-components';
import { useActions, useDevice, useSelector, useTranslation } from '@suite-hooks';
import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import Navigation, { NavPages } from './components/Navigation';
import SignAddressInput from './components/SignAddressInput';
import { useCopySignedMessage } from '@wallet-hooks/sign-verify/useCopySignedMessage';
import {
    useSignVerifyForm,
    SignVerifyFields,
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
} from '@wallet-hooks/sign-verify/useSignVerifyForm';

const Row = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    & + & {
        padding-top: 12px;
    }
    & > * + * {
        margin-left: 40px;
    }
`;

const StyledButton = styled(Button)`
    width: 200px;
`;

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

const SignVerify = () => {
    const [page, setPage] = useState<NavPages>('sign');

    const { selectedAccount, revealedAddresses } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        revealedAddresses: state.wallet.receive,
    }));

    const { isLocked, device } = useDevice();
    const { translationString } = useTranslation();
    const theme = useTheme();

    const {
        formDirty,
        formReset,
        formSubmit,
        formValues,
        formErrors,
        formSetSignature,
        formSetAopp,
        messageRef,
        signatureRef,
        hexField,
        addressField,
        pathField,
    } = useSignVerifyForm(page, selectedAccount.account);

    const { sign, verify, importAopp, sendAopp } = useActions({
        sign: signVerifyActions.sign,
        verify: signVerifyActions.verify,
        importAopp: signVerifyActions.importAopp,
        sendAopp: signVerifyActions.sendAopp,
    });

    const [stage, setStage] = useState<'init' | 'done' | 'sent'>('init');

    useEffect(() => {
        if (page === 'sign' && formValues.signature) return;
        setStage('init');
    }, [page, formValues.message, formValues.address, formValues.signature]);

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, aopp } = data;
        if (page === 'sign') {
            const result = await sign(path, message, hex, aopp);
            if (result) {
                formSetSignature(result);
                setStage('done');
            }
        } else {
            const result = await verify(address, message, signature, hex);
            if (result) setStage('done');
        }
    };

    const errorState = (err?: string) => (err ? 'error' : undefined);

    const { canCopy, copy } = useCopySignedMessage(formValues, selectedAccount.network?.name);

    return (
        <WalletLayout title="TR_NAV_SIGN_VERIFY" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_SIGN_VERIFY">
                {!device?.unavailableCapabilities?.aopp && (
                    /* TODO: This button available only for networks with aopp feature */
                    <Button
                        type="button"
                        data-test="@sign-verify/import-aopp"
                        variant="tertiary"
                        onClick={() =>
                            importAopp(selectedAccount.account?.symbol).then(
                                aopp => aopp && formSetAopp(aopp),
                            )
                        }
                    >
                        <Translation id="TR_AOPP_IMPORT" />
                    </Button>
                )}
                {page === 'sign' && canCopy && (
                    <Button type="button" variant="tertiary" onClick={copy}>
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                )}
                {formDirty && (
                    <Button type="button" variant="tertiary" onClick={formReset}>
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
                            state={errorState(formErrors.message)}
                            bottomText={formErrors.message}
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
                        {page === 'sign' ? (
                            <SignAddressInput
                                name="path"
                                label={<Translation id="TR_ADDRESS" />}
                                account={selectedAccount.account}
                                revealedAddresses={revealedAddresses}
                                error={formErrors.path}
                                data-test="@sign-verify/path"
                                {...pathField}
                            />
                        ) : (
                            <Input
                                name="address"
                                label={<Translation id="TR_ADDRESS" />}
                                type="text"
                                state={errorState(formErrors.address)}
                                bottomText={formErrors.address}
                                data-test="@sign-verify/select-address"
                                {...addressField}
                            />
                        )}
                    </Row>
                    <Row>
                        <Textarea
                            name="signature"
                            label={<Translation id="TR_SIGNATURE" />}
                            maxLength={MAX_LENGTH_SIGNATURE}
                            innerRef={signatureRef}
                            readOnly={page === 'sign'}
                            state={errorState(formErrors.signature)}
                            bottomText={formErrors.signature}
                            rows={4}
                            maxRows={4}
                            placeholder={
                                page === 'sign'
                                    ? translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')
                                    : undefined
                            }
                            data-test="@sign-verify/signature"
                        >
                            {page === 'verify' && (
                                <CharacterCount
                                    current={formValues.signature?.length || 0}
                                    max={MAX_LENGTH_SIGNATURE}
                                />
                            )}
                        </Textarea>
                    </Row>
                    <Row>
                        <StyledButton
                            type="submit"
                            isDisabled={isLocked()}
                            data-test="@sign-verify/submit"
                            variant={stage === 'init' ? 'primary' : 'secondary'}
                            icon={stage !== 'init' ? 'CHECK' : undefined}
                            size={24}
                        >
                            <Translation
                                id={(() => {
                                    if (page === 'sign')
                                        return stage === 'init' ? 'TR_SIGN' : 'TR_SIGNED';
                                    return stage === 'init' ? 'TR_VERIFY' : 'TR_VERIFIED';
                                })()}
                            />
                        </StyledButton>
                        {formValues.callback && (
                            <>
                                <Icon size={24} color={theme.TYPE_LIGHT_GREY} icon="ARROW_RIGHT" />
                                <StyledButton
                                    type="button"
                                    data-test="@sign-verify/send-aopp"
                                    isDisabled={stage === 'init'}
                                    onClick={() =>
                                        sendAopp(
                                            formValues.address,
                                            formValues.signature,
                                            formValues.callback,
                                        ).then(res => {
                                            if (res) setStage('sent');
                                        })
                                    }
                                    variant={stage === 'done' ? 'primary' : 'secondary'}
                                    icon={stage === 'sent' ? 'CHECK' : undefined}
                                    size={24}
                                >
                                    <Translation
                                        id={stage === 'sent' ? 'TR_SENT' : 'TR_AOPP_SEND'}
                                    />
                                </StyledButton>
                            </>
                        )}
                    </Row>
                </Form>
            </Card>
        </WalletLayout>
    );
};

export default SignVerify;
