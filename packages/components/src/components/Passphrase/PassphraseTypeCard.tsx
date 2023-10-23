import { useState, useRef, useEffect, useCallback, ReactNode, ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AnimatePresence, motion } from 'framer-motion';

import { useKeyPress } from '@trezor/react-utils';
import { setCaretPosition } from '@trezor/dom-utils';
import styled, { css, useTheme } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';
import { countBytesInString } from '@trezor/utils';
import { isAndroid } from '@trezor/env-utils';
import { formInputsMaxLength } from '@suite-common/validators';

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { motion as motionConfig } from '../../config';
import { Button } from '../buttons/Button/Button';
import { Checkbox } from '../form/Checkbox/Checkbox';
import { Input } from '../form/Input/Input';
import { Icon } from '../assets/Icon/Icon';
import { TooltipProps, Tooltip } from '../Tooltip/Tooltip';

const Wrapper = styled.div<Pick<PassphraseTypeCardProps, 'type' | 'singleColModal'>>`
    display: flex;
    flex: 1;
    /* align-items: center; */
    border-radius: 8px;
    flex-direction: column;
    text-align: left;
    width: 100%;

    & + & {
        margin-top: ${spacingsPx.md};
    }

    ${props =>
        !props.singleColModal &&
        css`
            padding: ${spacingsPx.sm};
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
        type === 'standard'
            ? theme.backgroundPrimarySubtleOnElevation1
            : theme.backgroundSurfaceElevation1};
    border-radius: ${borders.radii.sm};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: ${spacingsPx.xl};
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
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
    align-items: center;
    ${props => props.withMargin && `margin-bottom: ${spacingsPx.xxs};`}
`;

const Description = styled.div<Pick<PassphraseTypeCardProps, 'authConfirmation'>>`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

const InputWrapper = styled(Description)`
    width: 100%;

    ${props =>
        props.authConfirmation &&
        css`
            margin-top: ${spacingsPx.sm};
        `}
`;

const Spacer = styled.div`
    margin: ${spacingsPx.md} 0px;
`;

const PassphraseInput = styled(Input)`
    input {
        color: ${({ theme }) => theme.textSubdued};
        ${typography.hint}
    }
`;

const Row = styled.div`
    display: flex;
`;

const Actions = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: ${spacingsPx.md};
`;

const ActionButton = styled(Button)`
    margin-top: ${spacingsPx.xs};

    &:first-child {
        margin-top: 0px;
    }
`;

const OnDeviceActionButton = styled(ActionButton)`
    background: transparent;
    text-decoration: underline;
    color: ${({ theme }) => theme.textSubdued};

    &:first-child {
        margin-top: 0px;
    }

    &:hover,
    &:focus,
    &:active {
        color: ${({ theme }) => theme.textSubdued};
        background: transparent;
    }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    margin: ${spacingsPx.xs} ${spacingsPx.sm};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

export type PassphraseTypeCardProps = {
    title?: ReactNode;
    description?: ReactNode;
    submitLabel: ReactNode;
    type: 'standard' | 'hidden';
    offerPassphraseOnDevice?: boolean;
    singleColModal?: boolean;
    authConfirmation?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    learnMoreTooltipOnClick?: TooltipProps['addon'];
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

    const isTooLong = countBytesInString(value) > formInputsMaxLength.passphrase;

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

    const onPassphraseChange = (event: ChangeEvent<HTMLInputElement>) => {
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
                                <Icon size={24} icon="WALLET" color={theme.iconPrimaryDefault} />
                            ) : (
                                <Icon size={24} icon="LOCK" color={theme.iconSubdued} />
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
                                        addon={props.learnMoreTooltipOnClick}
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
                                <Icon icon="ARROW_RIGHT" color={theme.iconSubdued} />
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
                                autoFocus={!isAndroid()}
                                innerAddon={
                                    <Icon
                                        size={18}
                                        color={theme.iconSubdued}
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
                                    isFullWidth
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
                                isFullWidth
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
