import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

const Container = styled.div<{ isChecked: boolean; isDisabled?: boolean; isSmall?: boolean }>`
    display: flex;
    align-items: center;
    height: ${({ isSmall }) => (isSmall ? '18px' : '24px')};
    width: ${({ isSmall }) => (isSmall ? '32px' : '42px')};
    margin: 0px;
    padding: 3px;
    position: relative;
    background: ${({ theme, isChecked }) => (isChecked ? theme.BG_GREEN : theme.STROKE_GREY)};
    border-radius: 12px;
    transition: background 0.25s ease 0s;
    cursor: pointer;

    :hover,
    :focus-within {
        button {
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 1);
        }
    }

    :active {
        button {
            box-shadow: none;
        }
    }

    ${({ isDisabled }) =>
        isDisabled &&
        css`
            pointer-events: none;

            div {
                background: ${({ theme }) => theme.STROKE_GREY};
            }
        `}
`;

const Handle = styled.button<{ isSmall?: boolean; isChecked?: boolean }>`
    position: absolute;
    display: inline-block;
    height: ${({ isSmall }) => (isSmall ? '14px' : '18px')};
    width: ${({ isSmall }) => (isSmall ? '14px' : '18px')};
    border: none;
    border-radius: 50%;
    background: ${({ theme }) => theme.TYPE_WHITE};
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
    transform: ${({ isChecked, isSmall }) =>
        isChecked && `translateX(${isSmall ? '12px' : '18px'})`};
    transition: transform 0.25s ease 0s, box-shadow 0.15s ease 0s;
    cursor: pointer;

    :active {
        box-shadow: none;
    }
`;

const CheckboxInput = styled.input`
    border: 0px;
    clip: rect(0px, 0px, 0px, 0px);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0px;
    position: absolute;
    width: 1px;
`;

export interface SwitchProps {
    isChecked: boolean;
    onChange: (isChecked?: boolean) => void;
    isDisabled?: boolean;
    isSmall?: boolean;
    className?: string;
    dataTest?: string;
}

export const Switch = ({
    onChange,
    isDisabled,
    isSmall,
    dataTest,
    isChecked,
    className,
}: SwitchProps) => (
    <Container
        isChecked={isChecked}
        isDisabled={isDisabled}
        isSmall={isSmall}
        onClick={e => {
            e.preventDefault();
            onChange(!isChecked);
        }}
        className={className}
        data-test={dataTest}
    >
        <Handle isSmall={isSmall} isChecked={isChecked} type="button" />
        <CheckboxInput
            type="checkbox"
            role="switch"
            checked={isChecked}
            disabled={isDisabled}
            onChange={() => onChange(!isChecked)}
            aria-checked={isChecked}
        />
    </Container>
);
