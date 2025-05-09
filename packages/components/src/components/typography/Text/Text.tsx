import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { CSSColor, Color, Colors, borders, spacingsPx } from '@trezor/theme';

import { uiVariants } from '../../../config/types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import {
    TextProps as TextPropsCommon,
    TextPropsKeys,
    pickAndPrepareTextProps,
    withTextProps,
} from '../utils';

export const allowedTextTextProps = [
    'typographyStyle',
    'textWrap',
    'align',
    'ellipsisLineCount',
    'case',
    'wordBreak',
] as const satisfies TextPropsKeys[];
type AllowedTextTextProps = Pick<TextPropsCommon, (typeof allowedTextTextProps)[number]>;

export const allowedTextFrameProps = [
    'margin',
    'maxWidth',
    'flex',
    'position',
    'zIndex',
    'cursor',
    'opacity',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTextFrameProps)[number]>;

export const textVariants = [...uiVariants, 'purple'] as const;
export type TextVariant = (typeof textVariants)[number];

type ExclusiveColorOrVariant =
    | { variant?: TextVariant; color?: undefined }
    | {
          variant?: undefined;
          /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
          color?: string;
      };

const variantColorMap: Record<TextVariant, Color> = {
    default: 'textDefault',
    primary: 'textPrimaryDefault',
    secondary: 'textSecondaryHighlight',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
    purple: 'textAlertPurple',
    disabled: 'textDisabled',
};

type ColorProps = {
    theme: Colors;
} & TransientProps<ExclusiveColorOrVariant>;

const getColorForTextVariant = ({ $variant, theme, $color }: ColorProps): CSSColor | string => {
    if ($color !== undefined) {
        return $color;
    }

    return $variant !== undefined ? theme[variantColorMap[$variant]] : 'inherit';
};

type StyledTextProps = ExclusiveColorOrVariant & {
    $isMonospaced?: boolean;
    $isHighlighted?: boolean;
} & TransientProps<AllowedFrameProps & AllowedTextTextProps>;

const StyledText = styled.span<StyledTextProps>`
    color: ${getColorForTextVariant};

    ${({ $isMonospaced }) =>
        $isMonospaced &&
        css`
            font-family: monospace;
        `}

    ${({ $isHighlighted }) =>
        $isHighlighted &&
        css`
            display: inline;
            padding: 0 ${spacingsPx.xxs};
            border-radius: ${borders.radii.xxs};
            background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
            box-decoration-break: clone;
        `}

    ${withTextProps}
    ${withFrameProps}
`;

export type TextProps = {
    children: ReactNode;
    className?: string;
    isMonospaced?: boolean;
    isHighlighted?: boolean;
    as?: string;
    onClick?: () => void;
    'data-testid'?: string;
} & ExclusiveColorOrVariant &
    AllowedFrameProps &
    AllowedTextTextProps;

export const Text = ({
    variant,
    color,
    children,
    className,
    as = 'span',
    'data-testid': dataTest,
    onClick,
    isMonospaced,
    isHighlighted,
    ...rest
}: TextProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTextFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedTextTextProps);

    return (
        <StyledText
            {...(variant !== undefined ? { $variant: variant } : { $color: color })}
            className={className}
            as={as}
            onClick={onClick}
            data-testid={dataTest}
            $isMonospaced={isMonospaced}
            $isHighlighted={isHighlighted}
            {...textProps}
            {...frameProps}
        >
            {children}
        </StyledText>
    );
};
