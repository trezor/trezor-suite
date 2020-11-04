import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
    max-width: 100px;
    max-height: 100px;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;
    margin: 4px;

    padding-top: 30%;
    width: 100%;

    border-radius: 4px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_LIGHT_GREY};

    &:first-child {
        margin-left: 0px;
    }
    &:last-child {
        margin-right: 0px;
    }

    &:hover {
        background: ${props => props.theme.BG_GREY};
    }

    &:before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${props => props.theme.TYPE_DARK_GREY};
        top: calc(50% - 3px);
        left: calc(50% - 3px);
    }
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ButtonPin = ({ onClick, ...rest }: Props) => <Button onClick={onClick} {...rest} />;

export { ButtonPin, Props as ButtonPinProps };
