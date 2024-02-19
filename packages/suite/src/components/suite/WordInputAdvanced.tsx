import { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';
import { Button, PinButton, KEYBOARD_CODE } from '@trezor/components';
import { Translation, TrezorLink, DeviceMatrixExplanation } from 'src/components/suite';
import { createTimeoutPromise } from '@trezor/utils';
import TrezorConnect, { DeviceModelInternal, UI } from '@trezor/connect';

const Wrapper = styled.div`
    display: flex;
    height: 100%;
    justify-content: center;
`;

const MatrixWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 270px;
    height: 100%;
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-evenly;
`;

const Backspace = styled(Button)`
    margin: 8px;
`;

interface WordInputAdvancedProps {
    count: 6 | 9;
}

export const WordInputAdvanced = ({ count }: WordInputAdvancedProps) => {
    const onSubmit = useCallback(async (value: string) => {
        await createTimeoutPromise(600);
        TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value });
    }, []);

    const backspace = useCallback(() => {
        onSubmit(String.fromCharCode(8));
    }, [onSubmit]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
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
        <Wrapper>
            <DeviceMatrixExplanation
                items={[
                    {
                        key: '1',
                        title: <Translation id="TR_RECOVERY_MATRIX_DISPLAYED_ON_TREZOR" />,
                        deviceModelInternal: DeviceModelInternal.T1B1,
                    },
                    {
                        key: '2',
                        title: (
                            <TrezorLink
                                variant="underline"
                                href={HELP_CENTER_ADVANCED_RECOVERY_URL}
                            >
                                <Translation id="TR_LEARN_ADVANCED_RECOVERY" />
                            </TrezorLink>
                        ),
                        icon: 'INFO',
                    },
                ]}
            />
            <MatrixWrapper>
                {count === 9 && (
                    <>
                        <Row>
                            <PinButton data-value="7" onClick={() => onSubmit('7')} />
                            <PinButton data-value="8" onClick={() => onSubmit('8')} />
                            <PinButton data-value="9" onClick={() => onSubmit('9')} />
                        </Row>
                        <Row>
                            <PinButton data-value="4" onClick={() => onSubmit('4')} />
                            <PinButton data-value="5" onClick={() => onSubmit('5')} />
                            <PinButton data-value="6" onClick={() => onSubmit('6')} />
                        </Row>
                        <Row>
                            <PinButton
                                data-value="1"
                                onClick={() => onSubmit('1')}
                                data-test-id="@recovery/word-input-advanced/1"
                            />
                            <PinButton data-value="2" onClick={() => onSubmit('2')} />
                            <PinButton data-value="3" onClick={() => onSubmit('3')} />
                        </Row>
                    </>
                )}

                {count === 6 && (
                    <>
                        <Row>
                            <PinButton data-value="8" onClick={() => onSubmit('7')} />
                            <PinButton data-value="9" onClick={() => onSubmit('9')} />
                        </Row>
                        <Row>
                            <PinButton data-value="5" onClick={() => onSubmit('4')} />
                            <PinButton data-value="6" onClick={() => onSubmit('6')} />
                        </Row>
                        <Row>
                            <PinButton
                                data-value="2"
                                onClick={() => onSubmit('1')}
                                data-test-id="@recovery/word-input-advanced/1"
                            />
                            <PinButton data-value="3" onClick={() => onSubmit('3')} />
                        </Row>
                    </>
                )}
                <Backspace variant="tertiary" onClick={backspace} icon="ARROW_LEFT">
                    <Translation id="TR_BACKSPACE" />
                </Backspace>
            </MatrixWrapper>
        </Wrapper>
    );
};
