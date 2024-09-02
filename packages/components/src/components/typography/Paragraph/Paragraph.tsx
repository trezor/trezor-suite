import React from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { CSSColor, Color, typography, TypographyStyle } from '@trezor/theme';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import { UIVariant } from '../../../config/types';

export const allowedParagraphFrameProps = [
    'margin',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedParagraphFrameProps)[number]>;

export const paragraphVariants = [
    'primary',
    'secondary',
    'tertiary',
    'info',
    'warning',
    'destructive',
] as const;

export type ParagraphVariant = Extract<UIVariant, (typeof paragraphVariants)[number]>;

export type ParagraphProps = AllowedFrameProps & {
    typographyStyle?: TypographyStyle;
    variant?: ParagraphVariant;
    className?: string;
    'data-testid'?: string;
    children: React.ReactNode;
};

const mapVariantToColor = ({
    $variant,
    theme,
}: {
    $variant: ParagraphVariant;
    theme: DefaultTheme;
}): CSSColor => {
    const colorMap: Record<ParagraphVariant, Color> = {
        primary: 'textPrimaryDefault',
        secondary: 'textSecondaryHighlight',
        tertiary: 'textSubdued',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
    };

    return theme[colorMap[$variant]];
};

type StyledPProps = TransientProps<AllowedFrameProps> & {
    $typographyStyle: TypographyStyle;
    $variant?: ParagraphVariant;
};

const P = styled.p<StyledPProps>`
    ${({ $typographyStyle }) => typography[$typographyStyle]}
    ${({ $variant, theme }) => $variant && `color: ${mapVariantToColor({ $variant, theme })};`}
    ${withFrameProps}
`;

export const Paragraph = ({
    className,
    typographyStyle = 'body',
    'data-testid': dataTest,
    children,
    variant,
    ...rest
}: ParagraphProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedParagraphFrameProps);

    return (
        <P
            className={className}
            data-testid={dataTest}
            {...makePropsTransient({ variant, typographyStyle })}
            {...frameProps}
        >
            {children}
        </P>
    );
};
