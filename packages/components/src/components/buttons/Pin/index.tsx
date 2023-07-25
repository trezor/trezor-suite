import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
    max-width: 100px;
    height: 60px;
    transition: all 0.2s;
    position: relative;
    cursor: pointer;
    margin: 4px;

    width: 100%;

    border-radius: 5px;
    border: 1px solid ${({ theme }) => theme.BG_GREY};
    background: ${({ theme }) => theme.BG_GREY};

    &:first-child {
        margin-left: 0px;
    }
    &:last-child {
        margin-right: 0px;
    }

    &:hover {
        background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    }

    &:before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${({ theme }) => theme.TYPE_DARK_GREY};
        top: calc(50% - 3px);
        left: calc(50% - 3px);
    }

    &:hover:before {
        background: ${({ theme }) => theme.TYPE_GREEN};
    }
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ButtonPinProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ButtonPin = ({ onClick, ...rest }: ButtonPinProps) => <Button onClick={onClick} {...rest} />;

export { ButtonPin };
