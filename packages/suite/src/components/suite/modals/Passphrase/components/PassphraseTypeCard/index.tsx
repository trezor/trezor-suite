import dynamic from 'next/dynamic';
import React, { useState, createRef, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ANIMATION } from '@suite-config';
import { useKeyPress, setCaretPosition } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, colors, variables, Input, Tooltip, Checkbox, Icon } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { countBytesInString } from '@suite-utils/string';

const PasswordStrengthIndicator = dynamic(
    () => import('@suite-components/PasswordStrengthIndicator'),
    { ssr: false },
);

const Wrapper = styled.div<Pick<Props, 'type' | 'singleColModal'>>`
    display: flex;
    flex: 1;
    /* align-items: center; */
    border-radius: 6px;
    flex-direction: column;
    text-align: left;
    width: 100%;

    & + & {
        margin-top: 18px;
    }

    ${props =>
        !props.singleColModal &&
        css`
            padding: 12px;
            /* border: solid 1px ${colors.NEUE_STROKE_GREY}; */
        `}

    ${props =>
        props.type === 'standard' &&
        css`
            cursor: pointer;
        `}
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

const Description = styled.div<Pick<Props, 'authConfirmation'>>`
    display: flex;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    line-height: 1.33;
`;

const InputWrapper = styled(Description)`
    width: 100%;

    ${props =>
        props.authConfirmation &&
        css`
            margin-top: 12px;
        `}
`;

const Spacer = styled.div`
    margin: 16px 0px;
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};

    &:hover,
    &:focus,
    &:active {
        color: ${colors.NEUE_TYPE_LIGHT_GREY};
        background: transparent;
    }

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

const Content = styled.div`
    display: flex;
    flex: 1;
    margin: 8px 12px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const RetryButton = styled(Button)`
    align-self: center;
    margin-top: 16px;
`;

type Props = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    submitLabel: React.ReactNode;
    type: 'standard' | 'hidden';
    offerPassphraseOnDevice?: boolean;
    singleColModal?: boolean;
    authConfirmation?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    recreateWallet?: () => void;
};

const DOT = '●';

const PassphraseTypeCard = (props: Props) => {
    const [value, setValue] = useState('');
    const [enabled, setEnabled] = useState(!props.authConfirmation);
    const [showPassword, setShowPassword] = useState(false);
    const [hiddenWalletTouched, setHiddenWalletTouched] = useState(false);
    const enterPressed = useKeyPress('Enter');
    const backspacePressed = useKeyPress('Backspace');
    const deletePressed = useKeyPress('Delete');

    const ref = createRef<HTMLInputElement>();
    const caretRef = useRef<number>(0);

    const isTooLong = countBytesInString(value) > MAX_LENGTH.PASSPHRASE;

    const submit = (value: string, passphraseOnDevice?: boolean) => {
        if (!enabled) return;
        props.onSubmit(value, passphraseOnDevice);
    };

    if (enterPressed) {
        // Trigger submit on pressing Enter in case of single col modal (creating/confirming hidden wallet)
        // In case of two-col modal (selecting between standard and hidden wallet)
        // only the hidden wallet part handle the enter press.
        if (props.singleColModal || props.type === 'hidden') {
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
        const pos = event.target.selectionStart ?? len;
        const diff = newValue.length - len;

        // caret position is somewhere in the middle
        if (pos < len) {
            // added
            if (diff < 0) {
                const fill = new Array(Math.abs(diff)).fill(''); // make space for new string
                newValue.splice(pos + diff, 0, ...fill); // shift current value
            }
            // removed
            if (diff > 0) {
                newValue.splice(pos, diff);
            }
        }
        for (let i = 0; i < len; i++) {
            const char = tmpValue.charAt(i);
            if (char !== DOT) {
                newValue[i] = char;
            }
        }
        if (len < newValue.length) {
            // Check if last keypress was backspace or delete
            if (backspacePressed || deletePressed) {
                newValue.splice(pos, diff);
            } else {
                // Highlighted and replaced portion of the passphrase
                newValue.splice(pos - 1, diff + 1); // remove
                newValue.splice(pos - 1, 0, tmpValue[pos - 1]); // insert
            }
        }

        caretRef.current = pos;
        setValue(newValue.join(''));
    };

    const displayValue = !showPassword ? value.replace(/./g, DOT) : value;

    useEffect(() => {
        if (caretRef.current && ref.current) {
            setCaretPosition(ref.current, caretRef.current);
        }
        // todo: I agree that this smells. Need to figure out why input does not work as expected if ref is included in deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayValue]);

    return (
        <Wrapper
            type={props.type}
            singleColModal={props.singleColModal}
            onClick={() => {
                if (props.type === 'standard') {
                    submit(value);
                } else if (ref && ref.current) {
                    ref.current.focus();
                    setHiddenWalletTouched(true);
                }
            }}
        >
            {!props.singleColModal && (
                // only used to show options in modal where user selects wallet type
                // single col modal such as one for creating hidden wallet shows only input and submit button
                <>
                    <Row>
                        <IconWrapper type={props.type}>
                            {props.type === 'standard' ? (
                                <Icon size={24} icon="WALLET" color={colors.NEUE_TYPE_GREEN} />
                            ) : (
                                <Icon size={24} icon="LOCK" color={colors.NEUE_TYPE_LIGHT_GREY} />
                            )}
                        </IconWrapper>
                        <Col>
                            <WalletTitle>
                                {props.title}
                                {props.type === 'hidden' && (
                                    <Tooltip
                                        placement="top"
                                        content={<Translation id="TR_HIDDEN_WALLET_TOOLTIP" />}
                                    >
                                        <TooltipIcon
                                            useCursorPointer
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
                    {props.type === 'hidden' && <Spacer />}
                </>
            )}
            {props.type === 'hidden' && (
                <Row>
                    {/* Show passphrase input */}
                    <InputWrapper authConfirmation={props.authConfirmation}>
                        <PassphraseInput
                            data-test="@passphrase/input"
                            placeholder="Enter passphrase" // TODO: Localize
                            onChange={onChange}
                            value={displayValue}
                            innerRef={ref}
                            onClick={() => {
                                if (typeof ref.current?.selectionStart === 'number') {
                                    caretRef.current = ref.current.selectionStart;
                                }
                            }}
                            onKeyUp={() => {
                                if (typeof ref.current?.selectionStart === 'number') {
                                    caretRef.current = ref.current.selectionStart;
                                }
                            }}
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
                                    data-test="@passphrase/show-toggle"
                                />
                            }
                        />
                        {!isTooLong && <PasswordStrengthIndicator password={value} />}
                    </InputWrapper>
                </Row>
            )}
            {props.authConfirmation && (
                // Checkbox if user fully understands what's happening when confirming empty passphrase
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
            <AnimatePresence initial={false}>
                {props.type === 'hidden' && (
                    <Actions>
                        {/* Submit button */}
                        {/* Visible in standalone modal for creating a hidden wallet or after a click also in modal for selecting wallet type */}
                        {(props.singleColModal || hiddenWalletTouched) && (
                            <motion.div {...ANIMATION.EXPAND}>
                                <ActionButton
                                    data-test={`@passphrase/${
                                        props.type === 'hidden' ? 'hidden' : 'standard'
                                    }/submit-button`}
                                    isDisabled={!enabled || isTooLong}
                                    variant="primary"
                                    onClick={() => submit(value)}
                                    fullWidth
                                >
                                    {props.submitLabel}
                                </ActionButton>
                            </motion.div>
                        )}

                        {/* Offer entering passphrase on a device */}
                        {props.offerPassphraseOnDevice && (
                            <OnDeviceActionButton
                                isDisabled={!enabled}
                                variant="tertiary"
                                onClick={() => submit(value, true)}
                                fullWidth
                            >
                                <Translation id="TR_ENTER_PASSPHRASE_ON_DEVICE" />
                            </OnDeviceActionButton>
                        )}

                        {/* Try again button shows while confirming a passphrase */}
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
                )}
            </AnimatePresence>
        </Wrapper>
    );
};

export default PassphraseTypeCard;
