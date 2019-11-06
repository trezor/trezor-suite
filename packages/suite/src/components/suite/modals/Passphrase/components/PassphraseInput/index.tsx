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
    overflow: scroll;

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
    left: ${props => props.charPosition * 10 + 5}px;
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
`;

const Selector = styled.div<SelectorProps>`
    position: absolute;
    top: 5px;
    background: #b4d7ff;
    left: ${props => props.start * 10 + 8}px;
    width: ${props => props.end * 10}px;
    height: 20px;
`;

interface InputProps {
    focus: boolean;
}

interface DotProps {
    charPosition: number;
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
        }
    };

    const onBlur = () => {
        setFocus(false);
    };

    const keyDownHandler = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case 8:
                if (cursorPosition > 0) {
                    setValue((val: string[]) => {
                        val.splice(cursorPosition - 1, 1);
                        return val;
                    });
                    setCursorPosition(cursorPosition - 1);
                }
                break;
            case 16:
                // shift
                setShift(true);
                break;
            case 17:
            case 91:
                // ctrl on keydown ctrl/cmd
                setCtrl(true);
                break;
            case 37:
                // arrow left
                break;
            case 39:
                // arrow righ
                if (shift) {
                    setSelectorPosition(selectorPosition + 1);
                }
                break;
            default:
        }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        if (!focus) return;
        // console.log(event);
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
                // ctrl/cmd
                console.log('unset ctrl');
                setCtrl(false);
                break;
            case 37:
                // arrow left
                if (cursorPosition > 0 && !ctrl) {
                    setCursorPosition(cursorPosition - 1);
                }
                break;
            case 39:
                // arrow right
                if (cursorPosition < value.length && !ctrl) {
                    setCursorPosition(cursorPosition + 1);
                }
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
                if (event.key.length === 1 && !ctrl) {
                    // is char
                    setValue((val: string[]) => val.concat([event.key]));
                    setCursorPosition(cursorPosition + 1);
                } else {
                    // other
                    console.log('otherChar', event);
                }
        }
    };

    const onPaste = (evt: ClipboardEvent) => {
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
        setCursorPosition(key);
        setSelectorPosition(0);
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
    }, [focus, cursorPosition]);

    onChange(value.join(''));

    return (
        <InputDiv
            onClick={event => onFocus(event)}
            onBlur={() => onBlur()}
            tabIndex={0}
            focus={focus}
            ref={inputRef}
        >
            <Selector
                active={selectorPosition !== 0}
                start={cursorPosition}
                end={selectorPosition}
            />
            {value.map((val: string, key: number) => {
                return (
                    <DotWrapper
                        charPosition={key}
                        onClick={() => setCursor(key)}
                        key={`${val}-${key}`}
                    >
                        <Dot />
                    </DotWrapper>
                );
            })}
            <Cursor position={cursorPosition} active={focus && selectorPosition === 0} />
        </InputDiv>
    );
};

export default PassphraseInput;
