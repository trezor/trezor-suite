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
    left: ${props => props.position * 10 + 8}px;
    padding: 17px 2px 16px 3px;
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
    left: ${props => props.position * 10 + 10}px;
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

const Selection = styled.div<SelectionProps>`
    position: absolute;
    top: 10px;
    background: #b4d7ff;
    height: 20px;
    left: ${props => props.start * 10 + 8}px;
    width: ${props => props.end * 10}px;
    display: ${props => (props.active ? 'block' : 'none')};
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

interface SelectionProps {
    active: boolean;
    start: number;
    end: number;
}

interface Props {
    onChange: (value: string) => void;
}

const PassphraseInput: FunctionComponent<Props> = ({ onChange }) => {
    const [value, setInputValue] = useState([] as string[]);
    const [focus, setFocus] = useState(false);
    const [ctrl, setCtrl] = useState(false);
    const [shift, setShift] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectionPosition, setSelectionPosition] = useState(0);
    const inputRef = React.createRef<HTMLDivElement>();

    const onFocus = (event: React.MouseEvent<HTMLDivElement>) => {
        setFocus(true);
        if (event.target === inputRef.current) {
            setCursorPosition(value.length);
            setSelectionPosition(0);
        }
    };

    const onBlur = () => {
        setFocus(false);
        setCtrl(false);
        setShift(false);
    };

    const selectAll = () => {
        setCursorPosition(0);
        setSelectionPosition(value.length);
    };

    const setValue = (state: (val: string[]) => string[]) => {
        setInputValue(state);
        onChange(value.join(''));
    };

    const keyDownHandler = (event: KeyboardEvent) => {
        if (!focus) return;

        switch (event.keyCode) {
            case 8:
                // backspace

                // prevent go back
                event.preventDefault();
                event.stopPropagation();

                if (cursorPosition > 0 && selectionPosition === 0) {
                    // remove char before the cursor
                    setValue((val: string[]) => {
                        val.splice(cursorPosition - 1, 1);
                        return val;
                    });
                    setCursorPosition(cursorPosition - 1);
                } else if (selectionPosition !== 0) {
                    // remove selection
                    if (selectionPosition < 0) {
                        setValue((val: string[]) => {
                            val.splice(cursorPosition + selectionPosition, -selectionPosition);
                            return val;
                        });
                        setCursorPosition(cursorPosition + selectionPosition);
                    } else {
                        setValue((val: string[]) => {
                            val.splice(cursorPosition, selectionPosition);
                            return val;
                        });
                        setCursorPosition(cursorPosition);
                    }
                    setSelectionPosition(0);
                }
                break;
            case 16:
                // shift keydown
                setShift(true);
                break;
            case 17:
            case 91:
            case 224:
                // ctrl/cmd keydown
                setCtrl(true);
                break;
            case 37:
                if (shift) {
                    // move selection left
                    setSelectionPosition(selectionPosition - 1);
                } else if (cursorPosition > 0) {
                    setCursorPosition(cursorPosition - 1);
                    setSelectionPosition(0);
                }
                break;
            case 39:
                if (shift && selectionPosition + cursorPosition < value.length) {
                    // move selection right
                    setSelectionPosition(selectionPosition + 1);
                } else if (!shift && selectionPosition !== 0) {
                    setSelectionPosition(0);
                } else if (cursorPosition < value.length && !shift) {
                    setCursorPosition(cursorPosition + 1);
                    setSelectionPosition(0);
                }
                break;
            case 65:
                if (ctrl) {
                    // prevent select text on page
                    event.preventDefault();
                    event.stopPropagation();

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
                    console.log('otherKey', event);
                }
        }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        if (!focus) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.keyCode) {
            case 8:
                // backspace
                break;
            case 13:
                // enter
                break;
            case 16:
                // shift keydown
                setShift(false);
                break;
            case 17:
            case 91:
            case 224:
                // ctrl/cmd keydown
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
        setSelectionPosition(0);
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
    }, [focus, selectionPosition, cursorPosition, ctrl, shift]);

    return (
        <InputDiv
            onClick={event => onFocus(event)}
            onDoubleClick={() => selectAll()}
            onBlur={() => onBlur()}
            tabIndex={0}
            focus={focus}
            ref={inputRef}
        >
            <Selection
                active={selectionPosition !== 0}
                start={selectionPosition < 0 ? cursorPosition + selectionPosition : cursorPosition}
                end={selectionPosition < 0 ? -selectionPosition : selectionPosition}
            />
            {value.map((val: string, key: number) => {
                return (
                    <DotWrapper position={key} onClick={() => setCursor(key)} key={`${val}-${key}`}>
                        <Dot />
                    </DotWrapper>
                );
            })}
            <Cursor position={cursorPosition} active={focus && selectionPosition === 0} />
        </InputDiv>
    );
};

export default PassphraseInput;
