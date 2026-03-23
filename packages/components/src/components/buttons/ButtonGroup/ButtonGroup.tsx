import React from 'react';

import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { Tooltip, type TooltipProps } from '../../Tooltip/Tooltip';
import { type ButtonProps } from '../Button/Button';
import { type IconButtonProps } from '../IconButton/IconButton';
import { type ButtonIntent, type ButtonPriority, type ButtonSize } from '../types';
import { mapSizeToBorderRadius } from '../utils';

export const allowedButtonGroupFrameProps = [
    'margin',
    'minWidth',
    'maxWidth',
    'width',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedButtonGroupFrameProps = Pick<
    FrameProps,
    (typeof allowedButtonGroupFrameProps)[number]
>;

const Container = styled.div<TransientProps<AllowedButtonGroupFrameProps> & { $size: ButtonSize }>`
    display: flex;
    gap: 1px;
    align-items: stretch;

    :is(button, a) {
        border-radius: 4px;
    }

    > :is(button, a):first-child,
    > :first-child :is(button, a) {
        border-top-left-radius: ${({ $size }) => mapSizeToBorderRadius($size)};
        border-bottom-left-radius: ${({ $size }) => mapSizeToBorderRadius($size)};
    }

    > :is(button, a):last-child,
    > :last-child :is(button, a) {
        border-top-right-radius: ${({ $size }) => mapSizeToBorderRadius($size)};
        border-bottom-right-radius: ${({ $size }) => mapSizeToBorderRadius($size)};
    }

    ${withFrameProps}
`;

type AllowedChildrenPropsType = ButtonProps | IconButtonProps;

export type ButtonGroupProps = {
    intent?: ButtonIntent;
    priority?: ButtonPriority;
    size?: ButtonSize;
    isDisabled?: boolean;
    children: (React.ReactElement<AllowedChildrenPropsType | TooltipProps> | null)[];
} & AllowedButtonGroupFrameProps;

export const ButtonGroup = ({
    intent = 'brand',
    priority = 'primary',
    size = 'medium',
    isDisabled,
    children,
    ...rest
}: ButtonGroupProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedButtonGroupFrameProps);

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            if (
                child.type === Tooltip &&
                React.isValidElement((child.props as TooltipProps).children)
            ) {
                const tooltipProps = child.props as TooltipProps;
                const tooltipChild =
                    tooltipProps.children as React.ReactElement<AllowedChildrenPropsType>;
                const tooltipChildProps: AllowedChildrenPropsType = tooltipChild?.props;
                const childWithProps = React.cloneElement(tooltipChild, {
                    intent: tooltipChildProps.intent || intent,
                    priority: tooltipChildProps.priority || priority,
                    size,
                    isDisabled: tooltipChildProps.isDisabled || isDisabled,
                });

                return React.cloneElement(child, {}, childWithProps);
            }

            const childProps = child.props as AllowedChildrenPropsType;

            return React.cloneElement(child, {
                intent: childProps.intent || intent,
                priority: childProps.priority || priority,
                size,
                isDisabled: childProps.isDisabled || isDisabled,
            });
        }

        return child;
    });

    return (
        <Container $size={size} {...frameProps}>
            {childrenWithProps}
        </Container>
    );
};
