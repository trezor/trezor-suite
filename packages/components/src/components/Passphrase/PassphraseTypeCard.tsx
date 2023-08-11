import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AnimatePresence, motion } from 'framer-motion';

import { useKeyPress } from '@trezor/react-utils';
import { setCaretPosition } from '@trezor/dom-utils';
import styled, { css, useTheme } from 'styled-components';

import { countBytesInString } from '@trezor/utils';
import { isAndroid } from '@trezor/env-utils';

import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { variables, motion as motionConfig } from '../../config';
import { Button } from '../buttons/Button/Button';
import { Checkbox } from '../form/Checkbox';
import { Input } from '../form/Input';
import { Icon } from '../Icon';
import { TooltipProps, Tooltip } from '../Tooltip';

const MAX_LENGTH = 50;

const Wrapper = styled.div<Pick<PassphraseTypeCardProps, 'type' | 'singleColModal'>>`
    display: flex;
    flex: 1;
    /* align-items: center; */
    border-radius: 8px;
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
            /* border: solid 1px ${({ theme }) => theme.STROKE_GREY}; */
        `}

    ${props =>
        props.type === 'standard' &&
        css`
            cursor: pointer;
        `}
`;

const IconWrapper = styled.div<Pick<PassphraseTypeCardProps, 'type'>>`
    width: 38px;
    height: 38px;
    background: ${({ theme, type }) =>
        type === 'standard' ? theme.BG_LIGHT_GREEN : theme.BG_GREY};
    border-radius: 8px;
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

const WalletTitle = styled.div<{ withMargin: boolean }>`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: 500;
    line-height: 1.5;
    align-items: center;
    ${props => props.withMargin && `margin-bottom: 5px;`}
`;

const Description = styled.div<Pick<PassphraseTypeCardProps, 'authConfirmation'>>`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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

    &:first-child {
        margin-top: 0px;
    }
`;

const OnDeviceActionButton = styled(ActionButton)`
    background: transparent;
    text-decoration: underline;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    &:first-child {
        margin-top: 0px;
    }

    &:hover,
    &:focus,
    &:active {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        background: transparent;
    }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    margin: 8px 12px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

type PassphraseTypeCardProps = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    submitLabel: React.ReactNode;
    type: 'standard' | 'hidden';
    offerPassphraseOnDevice?: boolean;
    singleColModal?: boolean;
    authConfirmation?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    learnMoreTooltipOnClick?: TooltipProps['guideAnchor'];
    learnMoreTooltipAppendTo?: TooltipProps['appendTo'];
};

const DOT = '●';

export const PassphraseTypeCard = (props: PassphraseTypeCardProps) => {
    const theme = useTheme();
    const intl = useIntl();
    const [value, setValue] = useState('');
    const [enabled, setEnabled] = useState(!props.authConfirmation);
    const [showPassword, setShowPassword] = useState(false);
    const [hiddenWalletTouched, setHiddenWalletTouched] = useState(false);
    const enterPressed = useKeyPress('Enter');
    const backspacePressed = useKeyPress('Backspace');
    const deletePressed = useKeyPress('Delete');

    const ref = useRef<HTMLInputElement>(null);
    const caretRef = useRef<number>(0);

    const isTooLong = countBytesInString(value) > MAX_LENGTH;

    const { onSubmit } = props;
    const submit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!enabled) return;
            onSubmit(value, passphraseOnDevice);
        },
        [enabled, onSubmit],
    );

    const canSubmit = (props.singleColModal || props.type === 'hidden') && !isTooLong;

    // Trigger submit on pressing Enter in case of single col modal (creating/confirming hidden wallet)
    // In case of two-col modal (selecting between standard and hidden wallet)
    // only the hidden wallet part handle the enter press.
    useEffect(() => {
        if (enterPressed && canSubmit) {
            submit(value);
        }
    }, [enterPressed, canSubmit, submit, value]);

    const onPassphraseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const tmpValue = event.target.value;
        // spread current value into array
        const newValue = [...value];
        const len = tmpValue.length;
        const pos = event.target.selectionStart ?? len;
        const diff = newValue.length - len;
        setHiddenWalletTouched(true);

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
            data-test={`@passphrase-type/${props.type}`}
        >
            {!props.singleColModal && (
                // only used to show options in modal where user selects wallet type
                // single col modal such as one for creating hidden wallet shows only input and submit button
                <>
                    <Row>
                        <IconWrapper type={props.type}>
                            {props.type === 'standard' ? (
                                <Icon size={24} icon="WALLET" color={theme.TYPE_GREEN} />
                            ) : (
                                <Icon size={24} icon="LOCK" color={theme.TYPE_LIGHT_GREY} />
                            )}
                        </IconWrapper>
                        <Col>
                            <WalletTitle
                                withMargin={props.type === 'hidden'}
                                data-test={props.type === 'hidden' && '@tooltip/passphrase-tooltip'}
                            >
                                {props.type === 'hidden' ? (
                                    <Tooltip
                                        appendTo={props.learnMoreTooltipAppendTo}
                                        title={
                                            <FormattedMessage
                                                id="TR_WHAT_IS_PASSPHRASE"
                                                defaultMessage="Learn more about the difference"
                                            />
                                        }
                                        guideAnchor={props.learnMoreTooltipOnClick}
                                        content={
                                            <FormattedMessage
                                                id="TR_HIDDEN_WALLET_TOOLTIP"
                                                defaultMessage="Passphrases add a custom phrase (e.g. a word, sentence, or string of characters) to your recovery seed. This creates a hidden wallet; each hidden wallet can use its own passphrase. Your standard wallet will still be accessible without a passphrase."
                                            />
                                        }
                                        dashed
                                    >
                                        <>{props.title}</>
                                    </Tooltip>
                                ) : (
                                    props.title
                                )}
                            </WalletTitle>
                            <Description>{props.description}</Description>
                        </Col>
                        {props.type === 'standard' && (
                            <ArrowCol>
                                <Icon icon="ARROW_RIGHT" color={theme.TYPE_LIGHT_GREY} />
                            </ArrowCol>
                        )}
                    </Row>
                    {props.type === 'hidden' && <Spacer />}
                </>
            )}
            {props.type === 'hidden' && (
                <>
                    <Row>
                        {/* Show passphrase input */}
                        <InputWrapper authConfirmation={props.authConfirmation}>
                            <PassphraseInput
                                data-test="@passphrase/input"
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Enter passphrase',
                                    id: 'TR_ENTER_PASSPHRASE',
                                })}
                                onChange={onPassphraseChange}
                                value={displayValue}
                                innerRef={ref}
                                bottomText={
                                    isTooLong ? (
                                        // todo: resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325
                                        <FormattedMessage
                                            id="TR_PASSPHRASE_TOO_LONG"
                                            defaultMessage="Passphrase length has exceed the allowed limit."
                                        />
                                    ) : null
                                }
                                inputState={isTooLong ? 'error' : undefined}
                                noTopLabel
                                noError
                                autoFocus={!isAndroid()}
                                innerAddon={
                                    <Icon
                                        size={18}
                                        color={theme.TYPE_LIGHT_GREY}
                                        icon={showPassword ? 'HIDE' : 'SHOW'}
                                        onClick={() => {
                                            if (typeof ref.current?.selectionStart === 'number') {
                                                caretRef.current = ref.current.selectionStart;
                                            }
                                            setShowPassword(!showPassword);
                                        }}
                                        data-test="@passphrase/show-toggle"
                                    />
                                }
                            />
                        </InputWrapper>
                    </Row>
                    {!isTooLong && <PasswordStrengthIndicator password={value} />}
                </>
            )}
            {props.authConfirmation && (
                // Checkbox if user fully understands what's happening when confirming empty passphrase
                <Content>
                    <Checkbox
                        data-test="@passphrase/confirm-checkbox"
                        onClick={() => setEnabled(!enabled)}
                        isChecked={enabled}
                    >
                        <FormattedMessage
                            id="TR_I_UNDERSTAND_PASSPHRASE"
                            defaultMessage="I understand, passphrases cannot be retrieved unlike everyday passwords"
                        />
                    </Checkbox>
                </Content>
            )}
            <AnimatePresence initial={false}>
                {props.type === 'hidden' && (
                    <Actions>
                        {/* Submit button */}
                        {/* Visible in standalone modal for creating a hidden wallet or after a click also in modal for selecting wallet type */}
                        {(props.singleColModal || hiddenWalletTouched) && (
                            <motion.div {...motionConfig.motionAnimation.expand}>
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
                                data-test="@passphrase/enter-on-device-button"
                            >
                                <FormattedMessage
                                    id="TR_ENTER_PASSPHRASE_ON_DEVICE"
                                    defaultMessage="Enter passphrase on Trezor"
                                />
                            </OnDeviceActionButton>
                        )}
                    </Actions>
                )}
            </AnimatePresence>
        </Wrapper>
    );
};
