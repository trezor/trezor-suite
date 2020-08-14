import React, { useState, createRef, useLayoutEffect } from 'react';
import { useKeyPress } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, colors, variables, Input, Checkbox, Icon } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import PasswordStrengthIndicator from '@suite-components/PasswordStrengthIndicator';
import { MAX_PASSPHRASE_LENGTH } from '@suite-constants/passphrase';
import { countBytesInString } from '@suite-utils/string';

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
    padding: 0px;
    align-items: center;
    border: solid 2px ${colors.BLACK96};
    border-radius: 6px;
    justify-self: center;
    max-width: 360px;

    ${props =>
        !props.singleColModal &&
        css`
            width: 310px;
            /* padding needed only in big choose wallet type modal */
            padding: 32px 24px;
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
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const InputWrapper = styled(Content)`
    width: 100%;
    margin-top: 32px;
`;

const PassphraseInput = styled(Input)`
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Actions = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 32px;
`;

const ActionButton = styled(Button)`
    & + & {
        margin-top: 8px;
    }
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const RetryButton = styled(Button)`
    align-self: center;
    margin-top: 16px;
`;

const Padding = styled.div<{ singleColModal?: boolean }>`
    display: flex;
    width: 100%;
    flex-direction: column;

    padding: ${p => (p.singleColModal ? '0px 24px' : '0px')};
`;

type Props = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    submitLabel: React.ReactNode;
    colorVariant: 'primary' | 'secondary';
    showPassphraseInput?: boolean;
    authConfirmation?: boolean;
    singleColModal?: boolean;
    offerPassphraseOnDevice: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    recreateWallet?: () => void;
};

const DOT = '●';

const PassphraseTypeCard = (props: Props) => {
    const { authConfirmation } = props;
    const [enabled, setEnabled] = useState(!authConfirmation);
    const [value, setValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // const inputType = showPassword ? 'text' : 'password';
    const enterPressed = useKeyPress('Enter');
    const backspacePressed = useKeyPress('Backspace');
    const ref = createRef<HTMLInputElement>();
    const isTooLong = countBytesInString(value) > MAX_PASSPHRASE_LENGTH;

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
        // Trigger submit on pressing Enter in case of single col modal (creating/confirming hidden wallet)
        // In case of two-col modal (selecting between standard and hidden wallet)
        // only the hidden wallet part handle the enter press.
        if (props.singleColModal || props.showPassphraseInput) {
            if (!isTooLong) {
                submit(value);
            }
        }
    }

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const tmpValue = event.target.value;
        // spread current value into array
        const newValue = [...value];
        const len = tmpValue.length;
        const pos = event.target.selectionStart || len;
        const diff = newValue.length - len;
        if (pos < len && diff < 0) {
            // caret position is somewhere in the middle
            const fill = new Array(Math.abs(diff)).fill(''); // make space for new string
            newValue.splice(pos + diff, 0, ...fill); // shift current value
        }
        for (let i = 0; i < len; i++) {
            const char = tmpValue.charAt(i);
            if (char !== DOT) {
                newValue[i] = char;
            }
        }
        if (len < newValue.length) {
            // Check if last keypress was backspace or delete
            if (backspacePressed) {
                newValue.splice(pos, diff);
            } else {
                // Highlighted and replaced portion of the passphrase
                newValue.splice(pos - 1, diff + 1); // remove
                newValue.splice(pos - 1, 0, tmpValue[pos - 1]); // insert
            }
        }
        setValue(newValue.join(''));
    };

    const displayValue = !showPassword ? value.replace(/./g, DOT) : value;

    return (
        <Col colorVariant={props.colorVariant} singleColModal={props.singleColModal}>
            {props.title && <WalletTitle>{props.title}</WalletTitle>}
            {props.description && <Content>{props.description}</Content>}
            <Padding singleColModal={props.singleColModal}>
                {props.showPassphraseInput && (
                    <InputWrapper>
                        <PassphraseInput
                            data-test="@passphrase/input"
                            placeholder="Enter passphrase"
                            onChange={onChange}
                            value={displayValue}
                            innerRef={ref}
                            bottomText={
                                isTooLong ? <Translation id="TR_PASSPHRASE_TOO_LONG" /> : null
                            }
                            state={isTooLong ? 'error' : undefined}
                            variant="small"
                            noTopLabel
                            noError
                            innerAddon={
                                <StyledIcon
                                    size={18}
                                    color={colors.BLACK70}
                                    hoverColor={colors.BLACK70}
                                    icon={showPassword ? 'HIDE' : 'SHOW'}
                                    onClick={() => setShowPassword(!showPassword)}
                                />
                            }
                        />
                        {!isTooLong && <PasswordStrengthIndicator password={value} />}
                    </InputWrapper>
                )}
                {authConfirmation && (
                    <Content>
                        <Checkbox
                            data-test="@passphrase/confirm-checkbox"
                            onClick={() => setEnabled(!enabled)}
                            isChecked={enabled}
                        >
                            <Translation id="TR_I_UNDERSTAND_PASSPHRASE" />
                        </Checkbox>
                    </Content>
                )}
                <Actions>
                    <ActionButton
                        data-test="@passphrase/submit-button"
                        isDisabled={!enabled || isTooLong}
                        variant={props.singleColModal ? 'primary' : props.colorVariant}
                        onClick={() => submit(value)}
                        fullWidth
                    >
                        {props.submitLabel}
                    </ActionButton>
                    {props.showPassphraseInput && props.offerPassphraseOnDevice && (
                        <ActionButton
                            isDisabled={!enabled}
                            variant="tertiary"
                            icon="T2"
                            onClick={() => submit(value, true)}
                            fullWidth
                        >
                            <Translation id="TR_ENTER_PASSPHRASE_ON_DEVICE" />
                        </ActionButton>
                    )}
                    {props.recreateWallet && (
                        <RetryButton
                            variant="tertiary"
                            icon="ARROW_LEFT"
                            color={colors.BLACK50}
                            onClick={props.recreateWallet}
                        >
                            <Translation id="TR_TRY_AGAIN" />
                        </RetryButton>
                    )}
                </Actions>
            </Padding>
        </Col>
    );
};

export default PassphraseTypeCard;
