import { type HTMLProps, type ReactNode } from 'react';

import styled, { type DefaultTheme, type RuleSet, css } from 'styled-components';

import { type Color, borders, spacingsPx } from '@trezor/theme';

import { type TextIntent, type TextPriority, textIntents, textPriorities } from './types';
import { mapIntentToCSS } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import {
    type TextProps as TextPropsCommon,
    type TextPropsKeys,
    pickAndPrepareTextProps,
    withTextProps,
} from '../utils';

export { textIntents, textPriorities };
export type { TextIntent, TextPriority };

export const allowedTextTextProps = [
    'typographyStyle',
    'textWrap',
    'align',
    'ellipsisLineCount',
    'case',
    'wordBreak',
    'overflowWrap',
] as const satisfies TextPropsKeys[];
type AllowedTextTextProps = Pick<TextPropsCommon, (typeof allowedTextTextProps)[number]>;

export const allowedTextFrameProps = [
    'margin',
    'padding',
    'maxWidth',
    'minWidth',
    'width',
    'flex',
    'position',
    'zIndex',
    'cursor',
    'opacity',
    'pointerEvents',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTextFrameProps)[number]>;

type ExclusiveColorOrIntent =
    | {
          intent?: TextIntent;
          priority?: TextPriority;
          isDisabled?: boolean;
          color?: undefined;
      }
    | {
          intent?: undefined;
          priority?: undefined;
          isDisabled?: undefined;
          color?: Color;
      };

type ColorProps = {
    theme: DefaultTheme;
} & {
    $intent?: TextIntent;
    $priority?: TextPriority;
    $isDisabled?: boolean;
    $color?: Color;
};

const getColorForText = ({
    $intent,
    $priority = 'primary',
    $isDisabled,
    theme,
    $color,
}: ColorProps): RuleSet<object> => {
    if ($color !== undefined) {
        return css`
            color: ${theme[$color]};
        `;
    }

    if ($intent === undefined) {
        return css`
            color: inherit;
        `;
    }

    return css`
        color: ${mapIntentToCSS($intent, $priority, Boolean($isDisabled), theme)};
    `;
};

type StyledTextProps = {
    $intent?: TextIntent;
    $priority?: TextPriority;
    $isDisabled?: boolean;
    $color?: Color;
    $isMonospaced?: boolean;
    $isHighlighted?: boolean;
    $isTabular?: boolean;
} & TransientProps<AllowedFrameProps & AllowedTextTextProps>;

const StyledText = styled.span<StyledTextProps>`
    ${getColorForText};

    ${({ $isMonospaced }) =>
        $isMonospaced &&
        css`
            font-family: monospace;
        `}
    ${({ $isTabular }) =>
        $isTabular &&
        css`
            font-variant-numeric: tabular-nums;
            letter-spacing: 0 !important;
        `}
        ${({ $isHighlighted }) =>
        $isHighlighted &&
        css`
            display: inline;
            padding: 0 ${spacingsPx.xxs};
            border-radius: ${borders.radii.xxs};
            background-color: ${({ theme }) => theme.legacyBackgroundNeutralSubtleOnElevation0};
            box-decoration-break: clone;
        `}
        ${withTextProps} ${withFrameProps};
`;

export type TextProps = Pick<HTMLProps<HTMLElement>, 'onCopy' | 'onClick'> & {
    children: ReactNode;
    className?: string;
    isMonospaced?: boolean;
    isHighlighted?: boolean;
    isTabular?: boolean;
    as?: string;
    'data-testid'?: string;
    role?: string;
} & ExclusiveColorOrIntent &
    AllowedFrameProps &
    AllowedTextTextProps;

export const Text = ({
    intent,
    priority = 'primary',
    isDisabled = false,
    color,
    children,
    className,
    as = 'span',
    'data-testid': dataTest,
    onClick,
    onCopy,
    isMonospaced,
    isHighlighted,
    role,
    isTabular,
    ...rest
}: TextProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTextFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedTextTextProps);

    return (
        <StyledText
            $intent={intent}
            $priority={priority}
            $isDisabled={isDisabled}
            $color={color}
            className={className}
            as={as}
            onClick={onClick}
            onCopy={onCopy}
            data-testid={dataTest}
            $isMonospaced={isMonospaced}
            $isHighlighted={isHighlighted}
            $isTabular={isTabular}
            {...textProps}
            {...frameProps}
        >
            {children}
        </StyledText>
    );
};
