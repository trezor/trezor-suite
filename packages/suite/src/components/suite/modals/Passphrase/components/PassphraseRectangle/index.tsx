import React, { useState, createRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ANIMATION } from '@suite-config';
import { useKeyPress } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, colors, variables, Input, Tooltip, Icon } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { countBytesInString } from '@suite-utils/string';
import PasswordStrengthIndicator from '@suite-components/PasswordStrengthIndicator';
// import { Tooltip } from '@suite-components';

const Wrapper = styled.div<Pick<Props, 'type'>>`
    display: flex;
    flex: 1;
    padding: 12px;
    /* align-items: center; */
    border: solid 1px ${colors.NEUE_STROKE_GREY};
    border-radius: 6px;
    flex-direction: column;
    text-align: left;

    & + & {
        margin-top: 18px;
    }

    ${props =>
        props.type === 'standard' &&
        css`
            cursor: pointer;
        `}
    
    /* @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    } */
`;

const IconWrapper = styled.div<Pick<Props, 'type'>>`
    width: 38px;
    height: 38px;
    background: ${props =>
        props.type === 'standard' ? colors.NEUE_BG_LIGHT_GREEN : colors.NEUE_BG_GRAY};
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 24px;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    flex: 1;
`;

const ArrowCol = styled(Col)`
    flex: 0 0 auto;
    height: 100%;
    justify-content: center;
`;

const WalletTitle = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: 500;
    /* margin-bottom: 12px; */
    line-height: 1.5;
    align-items: center;
`;

const Description = styled.div`
    display: flex;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 500;
    line-height: 1.33;
`;

const InputWrapper = styled(Description)`
    width: 100%;
    margin-top: 16px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    padding-top: 16px;
`;

const PassphraseInput = styled(Input)`
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Row = styled.div`
    display: flex;
`;

const Actions = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 16px;
`;

const ActionButton = styled(Button)`
    margin-top: 8px;

    &::first-child {
        margin-top: 0px;
    }
`;

const OnDeviceActionButton = styled(ActionButton)`
    background: transparent;
    text-decoration: underline;

    &::first-child {
        margin-top: 0px;
    }
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const TooltipIcon = styled(Icon)`
    margin-left: 4px;
`;

type Props = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    submitLabel: React.ReactNode;
    type: 'standard' | 'hidden';
    offerPassphraseOnDevice?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    recreateWallet?: () => void;
};

const DOT = '●';

const PassphraseRectangle = (props: Props) => {
    const [value, setValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [hiddenWalletTouched, setHiddenWalletTouched] = useState(false);
    // const inputType = showPassword ? 'text' : 'password';
    const enterPressed = useKeyPress('Enter');
    const backspacePressed = useKeyPress('Backspace');
    const ref = createRef<HTMLInputElement>();
    const isTooLong = countBytesInString(value) > MAX_LENGTH.PASSPHRASE;

    const submit = (value: string, passphraseOnDevice?: boolean) => {
        props.onSubmit(value, passphraseOnDevice);
    };

    if (enterPressed) {
        // Trigger submit on pressing Enter in case of single col modal (creating/confirming hidden wallet)
        // In case of two-col modal (selecting between standard and hidden wallet)
        // only the hidden wallet part handle the enter press.
        if (props.type === 'hidden') {
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
        <Wrapper
            type={props.type}
            onClick={() => {
                if (props.type === 'standard') {
                    submit(value);
                } else if (ref && ref.current) {
                    ref.current.focus();
                    setHiddenWalletTouched(true);
                }
            }}
        >
            <Row>
                <IconWrapper type={props.type}>
                    {props.type === 'standard' ? (
                        <Icon icon="WALLET" color={colors.NEUE_TYPE_GREEN} />
                    ) : (
                        <Icon icon="LOCK" color={colors.NEUE_TYPE_LIGHT_GREY} />
                    )}
                </IconWrapper>
                <Col>
                    <WalletTitle>
                        {props.title}
                        {props.type === 'hidden' && (
                            <Tooltip
                                placement="top"
                                content={
                                    <Translation id="TR_WALLET_SELECTION_ENTER_EXISTING_PASSPHRASE" />
                                }
                            >
                                <TooltipIcon
                                    size={16}
                                    color={colors.NEUE_TYPE_LIGHT_GREY}
                                    icon="QUESTION_ACTIVE"
                                />
                            </Tooltip>
                        )}
                    </WalletTitle>
                    <Description>{props.description}</Description>
                </Col>
                {props.type === 'standard' && (
                    <ArrowCol>
                        <Icon icon="ARROW_RIGHT" color={colors.NEUE_TYPE_LIGHT_GREY} />
                    </ArrowCol>
                )}
            </Row>
            <Row>
                {props.type === 'hidden' && (
                    <InputWrapper>
                        <PassphraseInput
                            data-test="@passphrase/input"
                            placeholder="Enter passphrase" // TODO: Localize
                            onChange={onChange}
                            value={displayValue}
                            innerRef={ref}
                            bottomText={
                                isTooLong ? <Translation id="TR_PASSPHRASE_TOO_LONG" /> : null
                            }
                            state={isTooLong ? 'error' : undefined}
                            noTopLabel
                            noError
                            innerAddon={
                                <StyledIcon
                                    size={18}
                                    color={colors.NEUE_TYPE_LIGHT_GREY}
                                    icon={showPassword ? 'HIDE' : 'SHOW'}
                                    onClick={() => setShowPassword(!showPassword)}
                                />
                            }
                        />
                        {!isTooLong && <PasswordStrengthIndicator password={value} />}
                    </InputWrapper>
                )}
            </Row>
            <AnimatePresence initial={false}>
                {props.type === 'hidden' && (
                    <Actions>
                        {hiddenWalletTouched && (
                            <motion.div {...ANIMATION.EXPAND}>
                                <ActionButton
                                    data-test={`@passphrase/${
                                        props.type === 'hidden' ? 'hidden' : 'standard'
                                    }/submit-button`}
                                    isDisabled={isTooLong}
                                    variant="primary"
                                    onClick={() => submit(value)}
                                    fullWidth
                                >
                                    {props.submitLabel}
                                </ActionButton>
                            </motion.div>
                        )}

                        {props.type === 'hidden' && props.offerPassphraseOnDevice && (
                            <OnDeviceActionButton
                                variant="tertiary"
                                icon="T2"
                                onClick={() => submit(value, true)}
                                fullWidth
                            >
                                <Translation id="TR_ENTER_PASSPHRASE_ON_DEVICE" />
                            </OnDeviceActionButton>
                        )}
                    </Actions>
                )}
            </AnimatePresence>
        </Wrapper>
    );
};

export default PassphraseRectangle;
