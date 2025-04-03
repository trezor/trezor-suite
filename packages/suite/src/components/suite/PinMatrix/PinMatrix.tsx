import { useCallback, useEffect } from 'react';

import { formInputsMaxLength } from '@suite-common/validators';
import {
    Banner,
    Button,
    Card,
    Column,
    Grid,
    Input,
    KEYBOARD_CODE,
    Paragraph,
    PinButton,
    Row,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PIN_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { useExternalLink } from 'src/hooks/suite';

type PinMatrixProps = {
    pin: string;
    setPin: (pin: string) => void;
    onSubmit: () => void;
    showExplanation?: boolean;
    showLabel?: boolean;
};

export const PinMatrix = ({
    showExplanation,
    showLabel,
    pin,
    setPin,
    onSubmit,
}: PinMatrixProps) => {
    const learnMoreUrl = useExternalLink(HELP_CENTER_PIN_URL);

    const onPinBackspace = useCallback(() => {
        setPin(pin.substring(0, pin.length - 1));
    }, [pin, setPin]);

    const onPinAdd = useCallback(
        (input: string) => {
            if (pin.length < formInputsMaxLength.pin) {
                setPin(pin + input);
            }
        },
        [pin, setPin],
    );

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            switch (event.code) {
                case KEYBOARD_CODE.ENTER:
                case KEYBOARD_CODE.NUMPAD_ENTER:
                    onSubmit();
                    break;
                case KEYBOARD_CODE.BACK_SPACE:
                    onPinBackspace();
                    break;

                // numeric and numpad
                case KEYBOARD_CODE.DIGIT_ONE:
                case KEYBOARD_CODE.NUMPAD_ONE:
                    onPinAdd('1');
                    break;
                case KEYBOARD_CODE.DIGIT_TWO:
                case KEYBOARD_CODE.NUMPAD_TWO:
                    onPinAdd('2');
                    break;
                case KEYBOARD_CODE.DIGIT_THREE:
                case KEYBOARD_CODE.NUMPAD_THREE:
                    onPinAdd('3');
                    break;
                case KEYBOARD_CODE.DIGIT_FOUR:
                case KEYBOARD_CODE.NUMPAD_FOUR:
                    onPinAdd('4');
                    break;
                case KEYBOARD_CODE.DIGIT_FIVE:
                case KEYBOARD_CODE.NUMPAD_FIVE:
                    onPinAdd('5');
                    break;
                case KEYBOARD_CODE.DIGIT_SIX:
                case KEYBOARD_CODE.NUMPAD_SIX:
                    onPinAdd('6');
                    break;
                case KEYBOARD_CODE.DIGIT_SEVEN:
                case KEYBOARD_CODE.NUMPAD_SEVEN:
                    onPinAdd('7');
                    break;
                case KEYBOARD_CODE.DIGIT_EIGHT:
                case KEYBOARD_CODE.NUMPAD_EIGHT:
                    onPinAdd('8');
                    break;
                case KEYBOARD_CODE.DIGIT_NINE:
                case KEYBOARD_CODE.NUMPAD_NINE:
                    onPinAdd('9');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [onPinAdd, onPinBackspace, onSubmit]);

    return (
        <Column gap={spacings.md}>
            {showExplanation && (
                <Banner
                    variant="info"
                    icon="password"
                    rightContent={
                        <Banner.Button
                            href={learnMoreUrl}
                            icon="arrowUpRight"
                            iconAlignment="end"
                            size="tiny"
                        >
                            <Translation id="TR_LEARN_MORE" />
                        </Banner.Button>
                    }
                >
                    <Paragraph typographyStyle="hint">
                        <Translation id="TR_MAXIMUM_PIN_LENGTH" />
                    </Paragraph>
                </Banner>
            )}
            <Card label={showLabel ? <Translation id="TR_ENTER_PIN" /> : undefined}>
                <Column gap={spacings.xl} padding={spacings.md} data-testid="@pin">
                    <Grid columns={3} gap={spacings.lg} width="100%">
                        {
                            // prettier-ignore
                            // Order follows standard numeric keypad layout
                            ['7', '8', '9',
                             '4', '5', '6',
                             '1', '2', '3'].map(value => (
                                <PinButton
                                    key={value}
                                    data-value={value}
                                    onClick={() => onPinAdd(value)}
                                    data-testid={`@pin/input/${value}`}
                                />
                            ))
                        }
                    </Grid>
                    <Row gap={spacings.md}>
                        <Input disabled value={pin.replace(/[0-9]/g, '●')} size="small" />
                        <Button
                            variant="tertiary"
                            onClick={onPinBackspace}
                            size="small"
                            icon="caretLeft"
                        >
                            <Translation id="TR_BACKSPACE" />
                        </Button>
                    </Row>
                </Column>
            </Card>
        </Column>
    );
};
