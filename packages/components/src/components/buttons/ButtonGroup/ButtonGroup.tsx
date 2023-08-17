import React from 'react';
import styled from 'styled-components';
import { borders } from '@trezor/theme';
import { Button, ButtonProps } from '../Button/Button';
import { ButtonSize, ButtonVariant } from '../buttonStyleUtils';
import { IconButton, IconButtonProps } from '../IconButton/IconButton';

const Container = styled.div<{ variant: Exclude<ButtonVariant, 'danger'> }>`
    position: relative;
    display: flex;
    align-items: center;

    > button {
        border-radius: 0;
    }

    > :first-child {
        border-radius: ${borders.radii.full} 0 0 ${borders.radii.full};
    }

    > :last-child {
        border-radius: 0 ${borders.radii.full} ${borders.radii.full} 0;
    }

    > :not(:last-child) {
        position: relative;

        ::after {
            content: '';
            position: absolute;
            right: -1px;
            width: 1px;
            height: 66%;
            background: ${({ theme, variant }) =>
                variant === 'tertiary' ? theme.textOnTertiary : theme.textOnPrimary};
            opacity: 0.1;
        }
    }
`;

const checkChildren = (children: Array<React.ReactNode>) =>
    children.every(
        child =>
            React.isValidElement(child) && (child.type === Button || child.type === IconButton),
    );

interface ButtonGroupProps {
    variant?: Exclude<ButtonVariant, 'danger'>;
    buttonSize?: ButtonSize;
    isDisabled?: boolean;
    className?: string;
    children: React.ReactElement<ButtonProps | IconButtonProps>[];
}

export const ButtonGroup = ({
    variant = 'primary',
    buttonSize = 'large',
    isDisabled,
    className,
    children,
}: ButtonGroupProps) => {
    const areChildrenValid = checkChildren(children);

    if (!areChildrenValid) {
        console.error(
            'Invalid children passed to ButtonGroup. Only Button and IconButton are allowed.',
        );

        return null;
    }

    const childrenWithProps = children.map(child =>
        React.cloneElement(child, { variant, buttonSize, isDisabled }),
    );

    return (
        <Container variant={variant} className={className}>
            {childrenWithProps}
        </Container>
    );
};
