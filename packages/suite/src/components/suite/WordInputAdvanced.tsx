import { useCallback, useEffect } from 'react';

import {
    Banner,
    Button,
    Card,
    Column,
    Grid,
    KEYBOARD_CODE,
    Paragraph,
    PinButton,
} from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';
import { resolveAfter } from '@trezor/utils';

import { Translation } from 'src/components/suite';
import { useExternalLink } from 'src/hooks/suite';

type WordInputAdvancedProps = {
    count: 6 | 9;
};

export const WordInputAdvanced = ({ count }: WordInputAdvancedProps) => {
    const learnMoreUrl = useExternalLink(HELP_CENTER_ADVANCED_RECOVERY_URL);

    const onSubmit = useCallback(async (value: string) => {
        await resolveAfter(600);
        TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value });
    }, []);

    const backspace = useCallback(() => {
        onSubmit(String.fromCharCode(8));
    }, [onSubmit]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            if (count === 6) {
                return;
            }

            event.preventDefault();

            if (event.code === KEYBOARD_CODE.BACK_SPACE) {
                backspace();
            }
            switch (event.code) {
                // numeric and numpad
                case KEYBOARD_CODE.DIGIT_ONE:
                case KEYBOARD_CODE.NUMPAD_ONE:
                    onSubmit('1');
                    break;
                case KEYBOARD_CODE.DIGIT_TWO:
                case KEYBOARD_CODE.NUMPAD_TWO:
                    onSubmit('2');
                    break;
                case KEYBOARD_CODE.DIGIT_THREE:
                case KEYBOARD_CODE.NUMPAD_THREE:
                    onSubmit('3');
                    break;
                case KEYBOARD_CODE.DIGIT_FOUR:
                case KEYBOARD_CODE.NUMPAD_FOUR:
                    onSubmit('4');
                    break;
                case KEYBOARD_CODE.DIGIT_FIVE:
                case KEYBOARD_CODE.NUMPAD_FIVE:
                    onSubmit('5');
                    break;
                case KEYBOARD_CODE.DIGIT_SIX:
                case KEYBOARD_CODE.NUMPAD_SIX:
                    onSubmit('6');
                    break;
                case KEYBOARD_CODE.DIGIT_SEVEN:
                case KEYBOARD_CODE.NUMPAD_SEVEN:
                    onSubmit('7');
                    break;
                case KEYBOARD_CODE.DIGIT_EIGHT:
                case KEYBOARD_CODE.NUMPAD_EIGHT:
                    onSubmit('8');
                    break;
                case KEYBOARD_CODE.DIGIT_NINE:
                case KEYBOARD_CODE.NUMPAD_NINE:
                    onSubmit('9');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', keyboardHandler, false);

        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [backspace, count, onSubmit]);

    return (
        <Column gap={spacings.md}>
            <Banner
                variant="info"
                icon="question"
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
                <Paragraph typographyStyle="label">
                    <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />
                </Paragraph>
            </Banner>
            <Card paddingType="none">
                <Column gap={spacings.xl} padding={spacings.xxl} alignItems="flex-end">
                    <Grid columns={count === 9 ? 3 : 2} gap={spacings.lg} width="100%">
                        {count === 9 &&
                            // prettier-ignore
                            // Order follows standard numeric keypad layout
                            [7, 8, 9,
                             4, 5, 6,
                             1, 2, 3].map(num => (
                                <PinButton
                                    key={num}
                                    data-value={String(num)}
                                    onClick={() => onSubmit(String(num))}
                                    data-testid={
                                        num === 1 ? '@recovery/word-input-advanced/1' : undefined
                                    }
                                />
                            ))}
                        {count === 6 && (
                            // TODO: Do we need the data-value mess here? Can it be removed?
                            <>
                                <PinButton data-value="8" onClick={() => onSubmit('7')} />
                                <PinButton data-value="9" onClick={() => onSubmit('9')} />
                                <PinButton data-value="5" onClick={() => onSubmit('4')} />
                                <PinButton data-value="6" onClick={() => onSubmit('6')} />
                                <PinButton
                                    data-value="2"
                                    onClick={() => onSubmit('1')}
                                    data-testid="@recovery/word-input-advanced/1"
                                />
                                <PinButton data-value="3" onClick={() => onSubmit('3')} />
                            </>
                        )}
                    </Grid>
                    <Button variant="tertiary" onClick={backspace} size="small" icon="caretLeft">
                        <Translation id="TR_BACKSPACE" />
                    </Button>
                </Column>
            </Card>
        </Column>
    );
};
