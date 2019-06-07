import React from 'react';
import styled from 'styled-components';

interface KeyInsideProps {
    isPressed: boolean;
}

const KeyInside = styled.div<KeyInsideProps>`
    display: inline-block;
    padding: ${props => (props.isPressed ? '4px 10px' : '6px 10px')};
    font-size: 13px;
    line-height: 10px;
    color: #444d56;
    vertical-align: middle;
    background-color: #fafbfc;
    border: solid 1px #c6cbd1;
    border-bottom-color: #959da5;
    border-radius: 3px;
    box-shadow: inset 0 -3px 0 #959da5;
    box-shadow: ${props => (props.isPressed ? 'inset 0 -1px 0 #959da5' : 'inset 0 -3px 0 #959da5')};
    margin-top: auto;
`;

const KeySlot = styled.div`
    height: 30px;
    display: flex;
`;

interface Props {
    text: string;
    isPressed: boolean;
}

const Key = ({ text, isPressed }: Props) => (
    <KeySlot>
        <KeyInside isPressed={isPressed}>{text}</KeyInside>
    </KeySlot>
);

export default Key;
