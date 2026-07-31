import React from 'react';

import styled, { css, keyframes } from 'styled-components';

import { type BadgeIntent, type BadgeSize } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToIconColor,
    mapSizeToIconSize,
    mapSizeToPadding,
    mapSizeToTypographyStyle,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Text, type TextPriority } from '../typography/Text/Text';

const ENTRY_DURATION = 200;
const ENTRY_DELAY = 500;
const RING_DURATION = 1400;
const RING_DELAY = ENTRY_DELAY;
const PULSE_DELAY = RING_DELAY + RING_DURATION / 2;
const PULSE_ITERATIONS = 2;
const RING_ITERATIONS = 3;
const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)';

const badgeIn = keyframes`
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
`;

const badgePulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.96); }
`;

const badgeRing = keyframes`
    0% { opacity: 0.45; box-shadow: 0 0 0 0 var(--badge-color); }
    25% { opacity: 0.45; }
    100% { opacity: 0; box-shadow: 0 0 0 6px var(--badge-color); }
`;

export const allowedBadgeFrameProps = ['margin', 'cursor'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBadgeFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & { $intent: BadgeIntent; $isAnimated: boolean }
>`
    --badge-color: ${({ theme, $intent }) => theme[mapIntentToBackgroundColor($intent)]};
    display: inline-flex;
    border-radius: calc(infinity * 1px);
    background: var(--badge-color);

    ${({ $isAnimated }) =>
        $isAnimated &&
        css`
            position: relative;
            animation:
                ${badgeIn} ${ENTRY_DURATION}ms ${EASE_OUT} ${ENTRY_DELAY}ms both,
                ${badgePulse} ${RING_DURATION}ms ease-in-out ${PULSE_DELAY}ms ${PULSE_ITERATIONS};

            &::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                pointer-events: none;
                animation: ${badgeRing} ${RING_DURATION}ms ${EASE_OUT} ${RING_DELAY}ms
                    ${RING_ITERATIONS} both;
            }

            @media (prefers-reduced-motion: reduce) {
                animation: none;

                &::after {
                    display: none;
                }
            }
        `}

    ${withFrameProps}
`;

export type BadgeProps = AllowedFrameProps & {
    size?: BadgeSize;
    intent?: BadgeIntent;
    isAnimated?: boolean;
    /** Text emphasis. Defaults to full strength, dimmed for the `neutral` intent. */
    priority?: TextPriority;
    iconLeft?: IconComponent;
    iconRight?: IconComponent;
    children?: React.ReactNode;
    'data-testid'?: string;
};

export const Badge = ({
    size = 'medium',
    intent = 'neutral',
    isAnimated = false,
    priority = intent === 'neutral' ? 'secondary' : 'primary',
    iconLeft,
    iconRight,
    children,
    'data-testid': dataTest,
    ...rest
}: BadgeProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBadgeFrameProps);

    const iconProps = {
        color: mapIntentToIconColor(intent),
        size: mapSizeToIconSize(size),
    };

    return (
        <Container data-testid={dataTest} $intent={intent} $isAnimated={isAnimated} {...frameProps}>
            <Row gap={4} padding={mapSizeToPadding(size)}>
                {iconLeft && <Icon as={iconLeft} {...iconProps} />}
                <Text
                    as="div"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                    intent={intent}
                    priority={priority}
                    textWrap="nowrap"
                >
                    {children}
                </Text>
                {iconRight && <Icon as={iconRight} {...iconProps} />}
            </Row>
        </Container>
    );
};

export type { BadgeSize, BadgeIntent };
