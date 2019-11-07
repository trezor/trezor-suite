/* eslint-disable react/no-array-index-key */
import React, { useState, FunctionComponent, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { colors } from '@trezor/components';

const InputDiv = styled.div<InputProps>`
    position: relative;
    width: 100%;
    height: 40px;
    padding: 5px 12px 6px 12px;
    line-height: 1.42857143;
    font-size: 1rem;
    font-weight: 500;
    color: #333333;
    box-sizing: border-box;
    border-radius: 2px;
    border: 1px solid #e3e3e3;
    background-color: #ffffff;
    content: '***';
    overflow: hidden;
    cursor: text;

    ${props =>
        props.focus &&
        css`
            box-shadow: #d6d7d7 0px 0px 6px 0px;
            border-color: #e3e3e3;
        `}
`;

const DotWrapper = styled.div<DotProps>`
    position: absolute;
    top: 0;
    left: ${props => props.position * 10 + 5}px;
    padding: 17px 4px 16px;
`;

const Dot = styled.div`
    width: 6px;
    height: 6px;
    background: ${colors.TEXT};
    border-radius: 3px;
`;

const Cursor = styled.div<CursorProps>`
    position: absolute;
    top: 10px;
    width: 1px;
    height: 20px;
    background: ${colors.TEXT};
    left: ${props => props.position * 10 + 8}px;
    opacity: ${props => (props.active ? 1 : 0)};
    animation: blinker 1s linear infinite;
    display: ${props => (props.active ? 'block' : 'none')};

    @keyframes blinker {
        49% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
        100% {
            opacity: 0;
        }
    }
`;

const Selector = styled.div<SelectorProps>`
    position: absolute;
    top: 10px;
    background: #b4d7ff;
    height: 20px;
    left: ${props => props.start * 10 + 8}px;
    width: ${props => props.end * 10}px;
`;

interface InputProps {
    focus: boolean;
}

interface DotProps {
    position: number;
}

interface CursorProps {
    position: number;
    active: boolean;
}

interface SelectorProps {
    active: boolean;
    start: number;
    end: number;
}

interface Props {
    onChange: (value: string) => void;
}

const PassphraseInput: FunctionComponent<Props> = ({ onChange }) => {
    const [value, setValue] = useState([] as string[]);
    const [focus, setFocus] = useState(false);
    const [ctrl, setCtrl] = useState(false);
    const [shift, setShift] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectorPosition, setSelectorPosition] = useState(0);
    const inputRef = React.createRef<HTMLDivElement>();

    const onFocus = (event: React.MouseEvent<HTMLDivElement>) => {
        setFocus(true);
        if (event.target === inputRef.current) {
            setCursorPosition(value.length);
            setSelectorPosition(0);
        }
    };

    const onBlur = () => {
        setFocus(false);
        setCtrl(false);
        setShift(false);
    };

    const selectAll = () => {
        setCursorPosition(0);
        setSelectorPosition(value.length);
    };

    const keyDownHandler = (event: KeyboardEvent) => {
        if (!focus) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.keyCode) {
            case 8:
                // backspace
                if (cursorPosition > 0 && selectorPosition === 0) {
                    setValue((val: string[]) => {
                        val.splice(cursorPosition - 1, 1);
                        return val;
                    });
                    setCursorPosition(cursorPosition - 1);
                } else if (selectorPosition !== 0) {
                    if (selectorPosition < 0) {
                        setValue((val: string[]) => {
                            val.splice(cursorPosition + selectorPosition, -selectorPosition);
                            return val;
                        });
                        setCursorPosition(cursorPosition + selectorPosition);
                    } else {
                        setValue((val: string[]) => {
                            val.splice(cursorPosition, selectorPosition);
                            return val;
                        });
                        setCursorPosition(cursorPosition);
                    }
                    setSelectorPosition(0);
                }
                break;
            case 16:
                // shift
                setShift(true);
                break;
            case 17:
            case 91:
            case 224:
                // ctrl on keydown ctrl/cmd
                setCtrl(true);
                break;
            case 37:
                // arrow left
                if (shift) {
                    setSelectorPosition(selectorPosition - 1);
                } else if (cursorPosition > 0) {
                    setCursorPosition(cursorPosition - 1);
                    setSelectorPosition(0);
                }
                break;
            case 39:
                // arrow righ
                if (shift && selectorPosition + cursorPosition < value.length) {
                    setSelectorPosition(selectorPosition + 1);
                } else if (cursorPosition < value.length && !shift) {
                    setCursorPosition(cursorPosition + 1);
                    setSelectorPosition(0);
                }
                break;
            case 65:
            case 86:
                if (ctrl) {
                    // ctrl+a select all
                    event.preventDefault();
                    event.stopPropagation();
                    selectAll();
                } else {
                    setValue((val: string[]) => {
                        val.splice(cursorPosition, 0, ...[event.key]);
                        return val;
                    });
                    setCursorPosition(cursorPosition + 1);
                }
                break;
            default:
                if (event.key.length === 1 && !ctrl) {
                    setValue((val: string[]) => {
                        val.splice(cursorPosition, 0, ...[event.key]);
                        return val;
                    });
                    setCursorPosition(cursorPosition + 1);
                } else {
                    // other
                    console.log('otherChar', event);
                }
        }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        if (!focus) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.keyCode) {
            case 8:
                // backspace, handled on keydown
                break;
            case 13:
                // enter
                break;
            case 16:
                // shift
                setShift(false);
                break;
            case 17:
            case 91:
            case 224:
                // ctrl/cmd
                setCtrl(false);
                break;
            case 37:
                // arrow left
                break;
            case 39:
                // arrow right
                break;
            case 38:
                // arrow up
                setCursorPosition(0);
                break;
            case 40:
                // arrow down
                setCursorPosition(value.length);
                break;
            default:
        }
    };

    const onPaste = (evt: ClipboardEvent) => {
        if (!focus) return;
        console.log('onPaste');
        evt.stopPropagation();
        evt.preventDefault();

        const pasteValue = evt.clipboardData ? evt.clipboardData.getData('text').split('') : [];

        if (pasteValue.length) {
            setValue((val: string[]) => {
                val.splice(cursorPosition, 0, ...pasteValue);
                return val;
            });
            setCursorPosition(cursorPosition + pasteValue.length);
        }
    };

    const setCursor = (key: number) => {
        setSelectorPosition(0);
        setCursorPosition(key);
    };

    useEffect(() => {
        window.addEventListener('keyup', keyUpHandler);
        window.addEventListener('keydown', keyDownHandler);
        document.addEventListener('paste', onPaste);
        return () => {
            window.removeEventListener('keyup', keyUpHandler);
            window.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('paste', onPaste);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus, selectorPosition, cursorPosition, ctrl, shift]);

    onChange(value.join(''));

    return (
        <InputDiv
            onClick={event => onFocus(event)}
            onDoubleClick={() => selectAll()}
            onBlur={() => onBlur()}
            tabIndex={0}
            focus={focus}
            ref={inputRef}
        >
            <Selector
                active={selectorPosition !== 0}
                start={selectorPosition < 0 ? cursorPosition + selectorPosition : cursorPosition}
                end={selectorPosition < 0 ? -selectorPosition : selectorPosition}
            />
            {value.map((val: string, key: number) => {
                return (
                    <DotWrapper position={key} onClick={() => setCursor(key)} key={`${val}-${key}`}>
                        <Dot />
                    </DotWrapper>
                );
            })}
            <Cursor position={cursorPosition} active={focus && selectorPosition === 0} />
        </InputDiv>
    );
};

export default PassphraseInput;
