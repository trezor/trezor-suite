import React, { useState, createRef, useLayoutEffect } from 'react';
import { useKeyPress } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, colors, variables, Input, Checkbox } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import PasswordStrengthIndicator from '@suite-components/PasswordStrengthIndicator';

const WalletTitle = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 12px;
`;

const Col = styled.div<Pick<Props, 'colorVariant' | 'singleColModal'>>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 32px 24px;
    align-items: center;
    border: solid 2px ${colors.BLACK96};
    border-radius: 6px;
    justify-self: center;
    max-width: 360px;

    ${props =>
        !props.singleColModal &&
        css`
            width: 320px;
        `};

    ${props =>
        props.colorVariant === 'secondary' &&
        css`
            background: ${colors.BLACK96};
        `};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    color: ${colors.BLACK50};
    margin-bottom: 32px;
`;

const InputWrapper = styled(Content)`
    margin-bottom: 32px;
    width: 100%;
`;

const Actions = styled.div`
    width: 100%;
    /* margin-top: 20px; */
`;

const Padding = styled.div<{ singleColModal?: boolean }>`
    display: flex;
    width: 100%;
    flex-direction: column;

    padding: ${p => (p.singleColModal ? '0px 24px' : '0px')};
`;

type Props = {
    title: React.ReactNode;
    description: React.ReactNode;
    submitLabel: React.ReactNode;
    colorVariant: 'primary' | 'secondary';
    showPassphraseInput?: boolean;
    authConfirmation?: boolean;
    singleColModal?: boolean;
    offerPassphraseOnDevice: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

const PassphraseTypeCard = (props: Props) => {
    const { authConfirmation } = props;
    const [enabled, setEnabled] = useState(!authConfirmation);
    const [value, setValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPassword ? 'text' : 'password';
    const enterPressed = useKeyPress('Enter');
    const ref = createRef<HTMLInputElement>();

    useLayoutEffect(() => {
        if (ref && ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    const submit = (value: string, passphraseOnDevice?: boolean) => {
        if (!enabled) return;
        props.onSubmit(value, passphraseOnDevice);
    };

    if (enterPressed) {
        submit(value);
    }

    return (
        <Col colorVariant={props.colorVariant} singleColModal={props.singleColModal}>
            <WalletTitle>{props.title}</WalletTitle>
            <Content>{props.description}</Content>
            <Padding singleColModal={props.singleColModal}>
                {authConfirmation && (
                    <Content>
                        <Checkbox onClick={() => setEnabled(!enabled)} isChecked={enabled}>
                            <Translation {...messages.TR_I_UNDERSTAND_PASSPHRASE} />
                        </Checkbox>
                    </Content>
                )}
                {props.showPassphraseInput && (
                    <InputWrapper>
                        <Input
                            onChange={event => setValue(event.target.value)}
                            placeholder="Enter passphrase"
                            type={inputType}
                            value={value}
                            innerRef={ref}
                            display="block"
                            variant="small"
                            button={{
                                iconSize: 18,
                                icon: showPassword ? 'HIDE' : 'SHOW',
                                onClick: () => setShowPassword(!showPassword),
                            }}
                        />
                        <PasswordStrengthIndicator password={value} />
                    </InputWrapper>
                )}
                <Actions>
                    <Button
                        isDisabled={!enabled}
                        variant={props.singleColModal ? 'primary' : props.colorVariant}
                        onClick={() => submit(value)}
                        fullWidth
                    >
                        {props.submitLabel}
                    </Button>
                    {props.showPassphraseInput && props.offerPassphraseOnDevice && (
                        <Button
                            isDisabled={!enabled}
                            variant="secondary"
                            onClick={() => submit(value, true)}
                            fullWidth
                        >
                            <Translation {...messages.TR_ENTER_PASSPHRASE_ON_DEVICE} />
                        </Button>
                    )}
                </Actions>
            </Padding>
        </Col>
    );
};

export default PassphraseTypeCard;
