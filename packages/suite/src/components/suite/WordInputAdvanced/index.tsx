import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button, ButtonPin } from '@trezor/components';
import { Translation, TrezorLink, DeviceMatrixExplanation } from '@suite-components';
import { URLS } from '@suite-constants';

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

interface Props {
    count: 6 | 9;
    onSubmit: (value: string) => void;
}

const WordInputAdvanced = (props: Props) => {
    const { onSubmit, count } = props;

    const backspace = useCallback(() => {
        onSubmit(String.fromCharCode(8));
    }, [onSubmit]);

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            event.preventDefault();
            if (event.keyCode === 8) {
                backspace();
            }
            switch (event.keyCode) {
                // numeric and numpad
                case 49:
                case 97:
                    onSubmit('1');
                    break;
                case 50:
                case 98:
                    onSubmit('2');
                    break;
                case 51:
                case 99:
                    onSubmit('3');
                    break;
                case 52:
                case 100:
                    onSubmit('4');
                    break;
                case 53:
                case 101:
                    onSubmit('5');
                    break;
                case 54:
                case 102:
                    onSubmit('6');
                    break;
                case 55:
                case 103:
                    onSubmit('7');
                    break;
                case 56:
                case 104:
                    onSubmit('8');
                    break;
                case 57:
                case 105:
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
                        deviceImage: 1,
                    },
                    {
                        key: '2',
                        title: (
                            <TrezorLink variant="underline" href={URLS.WIKI_ADVANCED_RECOVERY}>
                                <Translation id="TR_LEARN_ADVANCED_RECOVERY" />
                            </TrezorLink>
                        ),
                        icon: 'INFO_ACTIVE',
                    },
                ]}
            />
            <MatrixWrapper>
                {count === 9 && (
                    <>
                        <Row>
                            <ButtonPin type="button" data-value="7" onClick={() => onSubmit('7')} />
                            <ButtonPin type="button" data-value="8" onClick={() => onSubmit('8')} />
                            <ButtonPin type="button" data-value="9" onClick={() => onSubmit('9')} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="4" onClick={() => onSubmit('4')} />
                            <ButtonPin type="button" data-value="5" onClick={() => onSubmit('5')} />
                            <ButtonPin type="button" data-value="6" onClick={() => onSubmit('6')} />
                        </Row>
                        <Row>
                            <ButtonPin
                                type="button"
                                data-value="1"
                                onClick={() => onSubmit('1')}
                                data-test="@recovery/word-input-advanced/1"
                            />
                            <ButtonPin type="button" data-value="2" onClick={() => onSubmit('2')} />
                            <ButtonPin type="button" data-value="3" onClick={() => onSubmit('3')} />
                        </Row>
                    </>
                )}

                {count === 6 && (
                    <>
                        <Row>
                            <ButtonPin type="button" data-value="8" onClick={() => onSubmit('7')} />
                            <ButtonPin type="button" data-value="9" onClick={() => onSubmit('9')} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="5" onClick={() => onSubmit('4')} />
                            <ButtonPin type="button" data-value="6" onClick={() => onSubmit('6')} />
                        </Row>
                        <Row>
                            <ButtonPin
                                type="button"
                                data-value="2"
                                onClick={() => onSubmit('1')}
                                data-test="@recovery/word-input-advanced/1"
                            />
                            <ButtonPin type="button" data-value="3" onClick={() => onSubmit('3')} />
                        </Row>
                    </>
                )}
                <Backspace variant="tertiary" onClick={() => backspace()} icon="ARROW_LEFT">
                    <Translation id="TR_BACKSPACE" />
                </Backspace>
            </MatrixWrapper>
        </Wrapper>
    );
};

export default WordInputAdvanced;
