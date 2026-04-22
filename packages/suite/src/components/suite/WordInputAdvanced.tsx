import { useCallback, useEffect } from 'react';

import { Translation } from '@suite/intl';
import { selectModalRequestId } from '@suite/modal';
import {
    Banner,
    Button,
    Card,
    Column,
    Grid,
    IconButton,
    KEYBOARD_CODE,
    Paragraph,
} from '@trezor/components';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';
import { resolveAfter } from '@trezor/utils';

import { useExternalLink, useSelector } from 'src/hooks/suite';

type WordInputAdvancedProps = {
    count: 6 | 9;
};

export const WordInputAdvanced = ({ count }: WordInputAdvancedProps) => {
    const learnMoreUrl = useExternalLink(HELP_CENTER_ADVANCED_RECOVERY_URL);
    const requestId = useSelector(selectModalRequestId);

    const onSubmit = useCallback(
        async (value: string) => {
            await resolveAfter(600);
            TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_WORD, payload: value, requestId });
        },
        [requestId],
    );

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
        <Column gap={16} maxWidth={380}>
            <Banner
                intent="info"
                icon="question"
                rightContent={
                    <Banner.Button href={learnMoreUrl} size="small">
                        <Translation id="TR_LEARN_MORE" />
                    </Banner.Button>
                }
                description={
                    <Paragraph typographyStyle="body-xs">
                        <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />
                    </Paragraph>
                }
            />
            <Card paddingType="none">
                <Column gap={40} padding={16} alignItems="center">
                    <Grid columns={count === 9 ? 3 : 2} gap={20}>
                        {(count === 9
                            ? // prettier-ignore
                              [7, 8, 9,
                               4, 5, 6,
                               1, 2, 3]
                            : // prettier-ignore
                              [7, 9,
                               4, 6,
                               1, 3]
                        ).map(num => (
                            <IconButton
                                key={num}
                                onClick={() => onSubmit(String(num))}
                                data-testid={`@recovery/word-input-advanced/${num}`}
                                icon="dotOutlineFilled"
                                intent="neutral"
                                priority="secondary"
                                size="large"
                            />
                        ))}
                    </Grid>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={backspace}
                        size="small"
                        iconLeft="caretLeft"
                    >
                        <Translation id="TR_BACKSPACE" />
                    </Button>
                </Column>
            </Card>
        </Column>
    );
};
