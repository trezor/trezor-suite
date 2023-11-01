import styled, { css } from 'styled-components';

import { getInputColor } from '../../../utils/utils';

const Container = styled.div<Pick<SwitchProps, 'isChecked' | 'isDisabled' | 'isSmall'>>`
    display: flex;
    align-items: center;
    height: ${({ isSmall }) => (isSmall ? '18px' : '24px')};
    width: ${({ isSmall }) => (isSmall ? '32px' : '42px')};
    flex-shrink: 0;
    margin: 0px;
    padding: 3px;
    position: relative;
    background: ${({ isChecked, isDisabled, theme }) =>
        getInputColor(theme, { checked: isChecked, disabled: isDisabled })};
    border-radius: 12px;
    transition: background 0.25s ease 0s;
    cursor: ${({ isDisabled }) => !isDisabled && 'pointer'};
    box-sizing: border-box;

    ${({ isDisabled }) =>
        !isDisabled &&
        css`
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
        `}
`;

const Handle = styled.button<{ disabled?: boolean } & Pick<SwitchProps, 'isChecked' | 'isSmall'>>`
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
    transition:
        transform 0.25s ease 0s,
        box-shadow 0.15s ease 0s;
    cursor: ${({ disabled }) => !disabled && 'pointer'};

    ${({ disabled }) =>
        !disabled &&
        css`
            :active {
                box-shadow: none;
            }
        `}
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
    id?: string;
    isChecked: boolean;
    onChange: (isChecked?: boolean) => void;
    isDisabled?: boolean;
    isSmall?: boolean;
    className?: string;
    dataTest?: string;
}

export const Switch = ({
    onChange,
    id,
    isDisabled,
    isSmall,
    dataTest,
    isChecked,
    className,
}: SwitchProps) => {
    const handleChange = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    return (
        <Container
            isChecked={isChecked}
            isDisabled={isDisabled}
            isSmall={isSmall}
            onClick={e => {
                e.preventDefault();
                handleChange();
            }}
            className={className}
            data-test={dataTest}
        >
            <Handle isSmall={isSmall} isChecked={isChecked} disabled={isDisabled} type="button" />
            <CheckboxInput
                id={id}
                type="checkbox"
                role="switch"
                checked={isChecked}
                disabled={isDisabled}
                onChange={handleChange}
                aria-checked={isChecked}
            />
        </Container>
    );
};
