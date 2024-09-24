import styled from 'styled-components';
import { CSSColor, Color, Colors } from '@trezor/theme';
import { ReactNode } from 'react';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TextPropsKeys, withTextProps, TextProps as TextPropsCommon } from '../utils';
import { uiVariants } from '../../../config/types';

export const allowedTextTextProps = [
    'typographyStyle',
    'textWrap',
    'align',
] as const satisfies TextPropsKeys[];
type AllowedTextTextProps = Pick<TextPropsCommon, (typeof allowedTextTextProps)[number]>;

export const allowedTextFrameProps = ['margin', 'maxWidth'] as const satisfies FramePropsKeys[];
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
    primary: 'textPrimaryDefault',
    secondary: 'textSecondaryHighlight',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
    purple: 'textAlertPurple',
};

type ColorProps = {
    theme: Colors;
} & TransientProps<ExclusiveColorOrVariant>;

const getColorForTextVariant = ({ $variant, theme, $color }: ColorProps): CSSColor | string => {
    if ($color !== undefined) {
        return $color;
    }

    return theme[$variant !== undefined ? variantColorMap[$variant] : 'textDefault'];
};

type StyledTextProps = ExclusiveColorOrVariant &
    TransientProps<AllowedFrameProps> &
    TransientProps<AllowedTextTextProps>;

const StyledText = styled.span<StyledTextProps>`
    color: ${getColorForTextVariant};
    ${withTextProps}
    ${withFrameProps}
`;

export type TextProps = {
    children: ReactNode;
    className?: string;
    as?: string;
    'data-testid'?: string;
} & ExclusiveColorOrVariant &
    AllowedFrameProps &
    AllowedTextTextProps;

export const Text = ({
    variant,
    color,
    children,
    className,
    typographyStyle,
    textWrap,
    align,
    as = 'span',
    'data-testid': dataTest,
    ...rest
}: TextProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTextFrameProps);

    return (
        <StyledText
            {...(variant !== undefined ? { $variant: variant } : { $color: color })}
            className={className}
            as={as}
            data-testid={dataTest}
            {...makePropsTransient({ typographyStyle, textWrap, align })}
            {...frameProps}
        >
            {children}
        </StyledText>
    );
};
