import { useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Translation, useTranslation } from '@suite/intl';
import { MODAL_CONTEXT_DEVICE } from '@suite/modal';
import { formInputsMaxLength } from '@suite-common/validators';
import {
    Box,
    Button,
    Card,
    Column,
    Icon,
    Image,
    Input,
    Note,
    Row,
    Text,
    Tooltip,
    motionEasing,
} from '@trezor/components';
import { UI_REQUEST } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { isAndroid } from '@trezor/env-utils';
import { PasswordStrengthIndicator } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { countBytesInString, getNonAsciiChars } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

type PassphraseInputCardProps = {
    deviceModel?: DeviceModelInternal;
    isLoading?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    offerPassphraseOnDevice: boolean;
    allowNonAsciiCharacters?: boolean;
    value?: string;
    setValue?: (value: string) => void;
};

const getErrorMessage = (isPassphraseTooLong: boolean, isUsingNonAsciiCharacters: boolean) => {
    if (isPassphraseTooLong) return <Translation id="TR_PASSPHRASE_TOO_LONG" />;
    if (isUsingNonAsciiCharacters) return <Translation id="TR_REMOVE_NON_RECOMMENDED_CHARACTERS" />;

    return null;
};

const heightFadeMotionProps = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.2, ease: motionEasing.transition },
    style: { overflow: 'hidden' as const },
};

export const PassphraseInputCard = ({
    deviceModel,
    isLoading,
    onSubmit,
    offerPassphraseOnDevice,
    allowNonAsciiCharacters = false,
    value: externalValue,
    setValue: setExternalValue,
}: PassphraseInputCardProps) => {
    const modal = useSelector(state => state.modal);
    const [internalValue, setInternalValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const { translationString } = useTranslation();
    const value = externalValue ?? internalValue;
    const setValue = setExternalValue ?? setInternalValue;

    const isDeviceLoading = !(
        modal.context === MODAL_CONTEXT_DEVICE && modal.windowType === UI_REQUEST.REQUEST_PASSPHRASE
    );

    const isPassphraseTooLong = countBytesInString(value) > formInputsMaxLength.passphrase;
    const isUsingNonAsciiCharacters = allowNonAsciiCharacters
        ? false
        : getNonAsciiChars(value) !== null;
    const errorMessage = getErrorMessage(isPassphraseTooLong, isUsingNonAsciiCharacters);
    const showCapsLockHint = isCapsLockOn && !errorMessage;

    useEffect(() => {
        if (!isFocused) {
            setIsCapsLockOn(false);

            return;
        }

        const handler = (event: KeyboardEvent) => {
            setIsCapsLockOn(event.getModifierState('CapsLock'));
        };

        window.addEventListener('keydown', handler);

        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [isFocused]);

    const submit = useCallback(
        (value2: string, passphraseOnDevice?: boolean) => {
            onSubmit(value2, passphraseOnDevice);
        },
        [onSubmit],
    );

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                submit(value);
            }}
        >
            <Card
                paddingType="none"
                footer={
                    offerPassphraseOnDevice ? (
                        <Row
                            gap={spacings.lg}
                            padding={spacings.md}
                            onClick={() => submit(value, true)}
                            data-testid="@passphrase/enter-on-device-button"
                            cursor="pointer"
                        >
                            {deviceModel && (
                                <Image alt="Trezor" image={`TREZOR_${deviceModel}`} height={34} />
                            )}
                            <Text intent="neutral" priority="secondary">
                                <Translation id="TR_ENTER_PASSPHRASE_ON_DEVICE" />
                            </Text>
                            <Icon
                                margin={{ left: 'auto' }}
                                name="caretRight"
                                intent="neutral"
                                priority="secondary"
                            />
                        </Row>
                    ) : null
                }
            >
                <Column gap={spacings.sm} padding={spacings.sm}>
                    <Column>
                        <Input
                            data-testid="@passphrase/input"
                            placeholder={translationString('TR_ENTER_PASSPHRASE')}
                            onChange={e => setValue(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onMouseDown={e => setIsCapsLockOn(e.getModifierState('CapsLock'))}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={!isAndroid()}
                            isMasked={!showPassword}
                            value={value}
                            bottomText={errorMessage}
                            hasError={!!errorMessage}
                            rightContent={
                                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                                <span onMouseDown={e => e.preventDefault()}>
                                    <Icon
                                        size={18}
                                        intent="neutral"
                                        priority="secondary"
                                        name={showPassword ? 'eyeClosed' : 'eye'}
                                        onClick={() => setShowPassword(prev => !prev)}
                                        data-testid="@passphrase/show-toggle"
                                    />
                                </span>
                            }
                        />
                        <AnimatePresence initial={false}>
                            {value && !errorMessage && (
                                <motion.div {...heightFadeMotionProps}>
                                    <Box padding={{ top: 8 }}>
                                        <PasswordStrengthIndicator password={value} />
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence initial={false}>
                            {showCapsLockHint && (
                                <motion.div {...heightFadeMotionProps}>
                                    <Box padding={{ top: 8 }}>
                                        <Note>
                                            <Translation id="TR_PASSPHRASE_CAPS_LOCK_ON" />
                                        </Note>
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Column>
                    <Tooltip content={errorMessage}>
                        <Button
                            intent="brand"
                            type="submit"
                            data-testid="@passphrase/hidden/submit-button"
                            isDisabled={
                                !value ||
                                isPassphraseTooLong ||
                                isDeviceLoading ||
                                isUsingNonAsciiCharacters
                            }
                            width="100%"
                            isLoading={isLoading}
                            size="large"
                        >
                            Confirm
                        </Button>
                    </Tooltip>
                </Column>
            </Card>
        </form>
    );
};
