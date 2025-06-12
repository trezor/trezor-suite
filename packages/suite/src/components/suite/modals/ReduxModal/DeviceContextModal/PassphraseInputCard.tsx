import { useCallback, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { formInputsMaxLength } from '@suite-common/validators';
import {
    Box,
    Button,
    Card,
    Column,
    Icon,
    Image,
    Input,
    Row,
    Text,
    Tooltip,
    motionEasing,
} from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { isAndroid } from '@trezor/env-utils';
import { PasswordStrengthIndicator } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { countBytesInString, getNonAsciiChars } from '@trezor/utils';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

type PassphraseInputCardProps = {
    deviceModel?: DeviceModelInternal;
    deviceLoading?: boolean;
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

export const PassphraseInputCard = ({
    deviceModel,
    deviceLoading,
    onSubmit,
    offerPassphraseOnDevice,
    allowNonAsciiCharacters = false,
    value: externalValue,
    setValue: setExternalValue,
}: PassphraseInputCardProps) => {
    const [internalValue, setInternalValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { translationString } = useTranslation();
    const value = externalValue ?? internalValue;
    const setValue = setExternalValue ?? setInternalValue;

    const isPassphraseTooLong = countBytesInString(value) > formInputsMaxLength.passphrase;
    const isUsingNonAsciiCharacters = allowNonAsciiCharacters
        ? false
        : getNonAsciiChars(value) !== null;
    const errorMessage = getErrorMessage(isPassphraseTooLong, isUsingNonAsciiCharacters);

    const submit = useCallback(
        (value2: string, passphraseOnDevice?: boolean) => {
            onSubmit(value2, passphraseOnDevice);
        },
        [onSubmit],
    );

    return (
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
                        <Text variant="tertiary">
                            <Translation id="TR_ENTER_PASSPHRASE_ON_DEVICE" />
                        </Text>
                        <Icon margin={{ left: 'auto' }} name="caretRight" variant="tertiary" />
                    </Row>
                ) : null
            }
        >
            <Column gap={spacings.sm} padding={spacings.sm}>
                <Column>
                    <Input
                        data-testid="@passphrase/input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={translationString('TR_ENTER_PASSPHRASE')}
                        onChange={e => setValue(e.target.value)}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={!isAndroid()}
                        value={value}
                        bottomText={errorMessage}
                        inputState={errorMessage ? 'error' : undefined}
                        innerAddon={
                            <Icon
                                size={18}
                                variant="tertiary"
                                name={showPassword ? 'eyeClosed' : 'eye'}
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="@passphrase/show-toggle"
                            />
                        }
                    />
                    <AnimatePresence initial={false}>
                        {value && !errorMessage && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                    duration: 0.2,
                                    ease: motionEasing.transition,
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <Box padding={{ top: spacings.xs }}>
                                    <PasswordStrengthIndicator password={value} />
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Column>
                <Tooltip content={errorMessage}>
                    <Button
                        variant="primary"
                        onClick={() => submit(value)}
                        data-testid="@passphrase/hidden/submit-button"
                        isDisabled={
                            !value ||
                            isPassphraseTooLong ||
                            deviceLoading ||
                            isUsingNonAsciiCharacters
                        }
                        isFullWidth
                    >
                        Confirm
                    </Button>
                </Tooltip>
            </Column>
        </Card>
    );
};
