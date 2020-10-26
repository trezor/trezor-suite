import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

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
    border: 1px solid ${colors.BLACK70};
    background: linear-gradient(to bottom, #fefefe, #f2f2f2);

    &:first-child {
        margin-left: 0px;
    }
    &:last-child {
        margin-right: 0px;
    }

    &:hover {
        background: ${colors.WHITE};
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

export default ButtonPin;
