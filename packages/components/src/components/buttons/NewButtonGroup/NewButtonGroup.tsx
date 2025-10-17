import React from 'react';

import styled from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { Tooltip, TooltipProps } from '../../Tooltip/Tooltip';
import { NewButtonProps } from '../NewButton/NewButton';
import { NewButtonIntent, NewButtonPriority, NewButtonSize } from '../NewButton/types';
import { addAlphaToHex, mapSizeToBorderRadius } from '../NewButton/utils';

export const allowedNewButtonGroupFrameProps = [
    'margin',
    'minWidth',
    'maxWidth',
    'width',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedNewButtonGroupFrameProps = Pick<
    FrameProps,
    (typeof allowedNewButtonGroupFrameProps)[number]
>;

const Container = styled.div<
    TransientProps<AllowedNewButtonGroupFrameProps> & { $size: NewButtonSize }
>`
    position: relative;
    display: flex;

    :is(button, a) {
        border-radius: 0;

        &:active {
            transform: none !important;
        }
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

    > :is(button, a):not(:last-child),
    :not(:last-child) :is(button, a) {
        position: relative;

        &::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background: ${({ theme }) => addAlphaToHex(theme.baseFillElementNeutralDark, 0.09)};
            pointer-events: none;
        }
    }

    ${withFrameProps}
`;

type AllowedChildrenPropsType = NewButtonProps;

export type NewButtonGroupProps = {
    intent?: NewButtonIntent;
    priority?: NewButtonPriority;
    size?: NewButtonSize;
    isDisabled?: boolean;
    children: (React.ReactElement<AllowedChildrenPropsType | TooltipProps> | null)[];
} & AllowedNewButtonGroupFrameProps;

export const NewButtonGroup = ({
    intent = 'brand',
    priority = 'primary',
    size = 'medium',
    isDisabled,
    children,
    ...rest
}: NewButtonGroupProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedNewButtonGroupFrameProps);

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
