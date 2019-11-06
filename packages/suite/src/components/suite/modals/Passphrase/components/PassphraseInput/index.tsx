/* eslint-disable react/no-array-index-key */
import React, { useState, FunctionComponent, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { colors } from '@trezor/components';

const InputDiv = styled.div<State>`
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

const DotWrapper = styled.div<DotsProps>`
    position: absolute;
    top: 0;
    left: ${props => props.charAt * 10 + 5}px;
    padding: 17px 4px 16px;
`;

const Dot = styled.div`
    width: 6px;
    height: 6px;
    background: ${colors.TEXT};
    border-radius: 3px;
`;

const FakeCursor = styled.div<CursorProps>`
    position: absolute;
    top: 10px;
    width: 1px;
    height: 20px;
    background: ${colors.TEXT};
    left: ${props => props.position * 10 + 8}px;
    opacity: ${props => (props.focus ? 1 : 0)};
`;

interface State {
    focus: boolean;
}

interface DotsProps {
    charAt: number;
}

interface CursorProps {
    position: number;
    focus: boolean;
}

interface Props {
    onChange: (value: string) => void;
}

const PassphraseInput: FunctionComponent<Props> = ({ onChange }) => {
    const [value, setValue] = useState([] as string[]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [focus, setFocus] = useState(false);
    const [lock, setLock] = useState(false);
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

    const keyHandler = (event: KeyboardEvent) => {
        if (!focus) return;
        // console.log(event);
        switch (event.keyCode) {
            case 8:
                // backspace
                if (cursorPosition >= 0) {
                    setValue((val: string[]) => {
                        val.splice(cursorPosition - 1, 1);
                        return val;
                    });
                    setCursorPosition(cursorPosition - 1);
                }
                break;
            case 13:
                // enter
                break;
            case 16:
                // shift
                break;
            case 17:
            case 93:
                // ctrl
                console.log('unset lock');
                setLock(false);
                break;
            case 37:
                // arrow left
                if (cursorPosition > 0) {
                    setCursorPosition(cursorPosition - 1);
                }
                break;
            case 39:
                // arrow right
                if (cursorPosition < value.length) {
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
                if (event.key.length === 1 && !lock) {
                    // is char
                    setValue((val: string[]) => val.concat([event.key]));
                    setCursorPosition(cursorPosition + 1);
                } else {
                    // other
                    console.log('otherChar', event);
                }
        }
    };

    const keyDownHandler = (event: KeyboardEvent) => {
        if (event.keyCode === 17 || event.keyCode === 91) {
            console.log('set lock');
            setLock(true);
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
        }
    };

    const setCursor = (key: number) => {
        setCursorPosition(key);
    };

    useEffect(() => {
        window.addEventListener('keyup', keyHandler);
        window.addEventListener('keydown', keyDownHandler);
        document.addEventListener('paste', onPaste);
        return () => {
            window.removeEventListener('keyup', keyHandler);
            window.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('paste', onPaste);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus, cursorPosition]);

    console.log(value);

    return (
        <InputDiv
            onClick={event => onFocus(event)}
            onBlur={() => onBlur()}
            tabIndex={0}
            focus={focus}
            ref={inputRef}
        >
            {value.map((val: string, key: number) => {
                return (
                    <DotWrapper charAt={key} onClick={() => setCursor(key)} key={`${val}-${key}`}>
                        <Dot />
                    </DotWrapper>
                );
            })}
            <FakeCursor position={cursorPosition} focus={focus} />
        </InputDiv>
    );
};

export default PassphraseInput;
