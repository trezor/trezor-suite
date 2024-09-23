import React from 'react';
import styled from 'styled-components';
import { borders } from '@trezor/theme';
import { ButtonProps } from '../Button/Button';
import { ButtonSize, ButtonVariant } from '../buttonStyleUtils';
import { IconButtonProps } from '../IconButton/IconButton';
import { Tooltip, TooltipProps } from '../../Tooltip/Tooltip';

const Container = styled.div<{
    $variant?: Exclude<ButtonVariant, 'danger'>;
}>`
    position: relative;
    display: flex;
    align-items: stretch;

    button {
        border-radius: 0;
    }

    > :first-child,
    > :first-child button {
        border-radius: ${borders.radii.full} 0 0 ${borders.radii.full};
    }

    > :last-child,
    > :last-child button {
        border-radius: 0 ${borders.radii.full} ${borders.radii.full} 0;
    }

    > button:not(:last-child, :is([disabled])),
    > div:not(:last-child) button:not(:is([disabled])) {
        position: relative;

        &::after {
            content: '';
            position: absolute;
            right: -1px;
            width: 1px;
            height: 66%;
            background: ${({ theme, $variant }) =>
                $variant === 'tertiary' ? theme.textOnTertiary : theme.textOnPrimary};
            opacity: 0.1;
        }
    }
`;

type AllowedChildrenPropsType = ButtonProps | IconButtonProps;

interface ButtonGroupProps {
    variant?: Exclude<ButtonVariant, 'danger'>;
    size?: ButtonSize;
    isDisabled?: boolean;
    className?: string;
    children: React.ReactElement<AllowedChildrenPropsType | TooltipProps>[];
}

export const ButtonGroup = ({
    variant,
    size,
    isDisabled,
    className,
    children,
}: ButtonGroupProps) => {
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            if (
                child.type === Tooltip &&
                React.isValidElement((child.props as TooltipProps).children)
            ) {
                const tooltipProps = child.props as TooltipProps;
                const tooltipChild = tooltipProps.children as React.ReactElement;
                const tooltipChildProps: AllowedChildrenPropsType = tooltipChild?.props;
                const childWithProps = React.cloneElement(tooltipChild, {
                    variant: tooltipChildProps.variant || variant,
                    size: tooltipChildProps.size || size,
                    isDisabled: tooltipChildProps.isDisabled || isDisabled,
                });

                return React.cloneElement(child, {}, childWithProps);
            }

            const childProps = child.props as AllowedChildrenPropsType;

            return React.cloneElement(child, {
                variant: childProps.variant || variant,
                size: childProps.size || size,
                isDisabled: childProps.isDisabled || isDisabled,
            });
        }

        return child;
    });

    return (
        <Container $variant={variant} className={className}>
            {childrenWithProps}
        </Container>
    );
};
