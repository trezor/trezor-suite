import React from 'react';
import styled from 'styled-components';
import colors from '../../../config/colors';

const Button = styled.button`
    width: 80px;
    height: 80px;
    border: 1px solid ${colors.BLACK0};
    background: ${colors.WHITE};
    transition: all 0.3s;
    position: relative;
    cursor: pointer;

    &:first-child {
        margin-left: 0px;
    }

    &:hover {
        color: ${colors.BLACK0};
        background-color: ${colors.WHITE};
        border-color: ${colors.BLACK0};
    }

    &:active {
        color: ${colors.BLACK0};
        background: ${colors.BLACK0};
        border-color: ${colors.BLACK0};
    }

    &:before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${colors.BLACK0};
        top: calc(50% - 3px);
        left: calc(50% - 3px);
    }
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ButtonPin = ({ onClick, ...rest }: Props) => <Button onClick={onClick} {...rest} />;

export { ButtonPin, Props as ButtonPinProps };
