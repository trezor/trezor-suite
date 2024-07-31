import { FormattedMessage, useIntl } from 'react-intl';
import { ChangeEvent, MutableRefObject, ReactNode, RefObject } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { isAndroid } from '@trezor/env-utils';
import {
    Card,
    Column,
    Row,
    Input,
    Button,
    Icon,
    motionAnimation,
    PasswordStrengthIndicator,
} from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { useKeyPress } from '@trezor/react-utils';

import { WalletType } from './types';
import { DOT } from './consts';

const PassphraseInput = styled(Input)`
    input {
        color: ${({ theme }) => theme.textSubdued};
        ${typography.hint}
    }
`;

const Actions = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const ActionButton = styled(Button)`
    margin-top: ${spacingsPx.xs};

    &:first-child {
        margin-top: 0;
    }
`;

const Description = styled.div`
    display: flex;
    flex: 1;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

type PassphraseTypeCardContentProps = {
    submitLabel: ReactNode;
    type: WalletType;
    singleColModal?: boolean;
    displayValue: string;
    isPassphraseTooLong: boolean;
    value: string;
    setValue: (value: string) => void;
    showPassword: boolean;
    setShowPassword: (showPassword: boolean) => void;
    hiddenWalletTouched: boolean;
    setHiddenWalletTouched: (hiddenWalletTouched: boolean) => void;
    submit: (value: string, passphraseOnDevice?: boolean) => void;
    caretRef: MutableRefObject<number>;
    innerRef: RefObject<HTMLInputElement>;
};

export const PassphraseTypeCardContent = ({
    type,
    displayValue,
    isPassphraseTooLong,
    singleColModal,
    value,
    setValue,
    submitLabel,
    showPassword,
    setShowPassword,
    hiddenWalletTouched,
    setHiddenWalletTouched,
    submit,
    caretRef,
    innerRef,
}: PassphraseTypeCardContentProps) => {
    const theme = useTheme();
    const intl = useIntl();
    const isPassphraseEmpty = value.length === 0;
    const backspacePressed = useKeyPress('Backspace');
    const deletePressed = useKeyPress('Delete');

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

    return (
        <Card paddingType="small">
            <Column gap={spacings.sm} alignItems="stretch">
                {type === 'hidden' && (
                    <>
                        <Row flex={1}>
                            {/* Show passphrase input */}
                            <Description>
                                <PassphraseInput
                                    data-test="@passphrase/input"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Enter passphrase',
                                        id: 'TR_ENTER_PASSPHRASE',
                                    })}
                                    onChange={onPassphraseChange}
                                    value={displayValue}
                                    hasBottomPadding={false}
                                    innerRef={innerRef}
                                    bottomText={
                                        isPassphraseTooLong ? (
                                            // todo: resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325
                                            <FormattedMessage
                                                id="TR_PASSPHRASE_TOO_LONG"
                                                defaultMessage="Passphrase length has exceed the allowed limit."
                                            />
                                        ) : null
                                    }
                                    inputState={isPassphraseTooLong ? 'error' : undefined}
                                    autoFocus={!isAndroid()}
                                    innerAddon={
                                        <Icon
                                            size={18}
                                            color={theme.iconSubdued}
                                            icon={showPassword ? 'HIDE' : 'SHOW'}
                                            onClick={() => {
                                                if (
                                                    typeof innerRef.current?.selectionStart ===
                                                    'number'
                                                ) {
                                                    caretRef.current =
                                                        innerRef.current.selectionStart;
                                                }
                                                setShowPassword(!showPassword);
                                            }}
                                            data-test="@passphrase/show-toggle"
                                        />
                                    }
                                />
                            </Description>
                        </Row>
                        {value && !isPassphraseTooLong && (
                            <PasswordStrengthIndicator password={value} />
                        )}
                    </>
                )}

                <AnimatePresence initial={false}>
                    {type === 'hidden' && (
                        <Actions>
                            {/* Submit button */}
                            {/* Visible in standalone modal for creating a passphrase wallet or after a click also in modal for selecting wallet type */}
                            {(singleColModal || hiddenWalletTouched) && (
                                <motion.div {...motionAnimation.expand}>
                                    <ActionButton
                                        data-test={`@passphrase/${
                                            type === 'hidden' ? 'hidden' : 'standard'
                                        }/submit-button`}
                                        isDisabled={isPassphraseEmpty || isPassphraseTooLong}
                                        variant="primary"
                                        onClick={() => submit(value)}
                                        isFullWidth
                                    >
                                        {submitLabel}
                                    </ActionButton>
                                </motion.div>
                            )}
                        </Actions>
                    )}
                </AnimatePresence>
            </Column>
        </Card>
    );
};
