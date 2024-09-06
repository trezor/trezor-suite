import styled from 'styled-components';
import { UIVariant } from '../../../config/types';
import { CSSColor, Color, Colors, TypographyStyle } from '@trezor/theme';
import { ReactNode } from 'react';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TextPropsKeys, TextWrap, withTextProps, TextProps as TextPropsCommon } from '../utils';

export const allowedTextTextProps = [
    'typographyStyle',
    'textWrap',
] as const satisfies TextPropsKeys[];
type AllowedTextTextProps = Pick<TextPropsCommon, (typeof allowedTextTextProps)[number]>;

export const allowedTextFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTextFrameProps)[number]>;

export type TextVariant =
    | Extract<UIVariant, 'primary' | 'secondary' | 'tertiary' | 'info' | 'warning' | 'destructive'>
    | 'purple';

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

type StyledTextProps = {
    $typographyStyle?: TypographyStyle;
    $textWrap?: TextWrap;
} & ExclusiveColorOrVariant &
    TransientProps<AllowedFrameProps> &
    TransientProps<AllowedTextTextProps>;

const StyledText = styled.span<StyledTextProps>`
    color: ${getColorForTextVariant};
    ${withTextProps}
    ${withFrameProps}
`;

type TextProps = {
    children: ReactNode;
    className?: string;
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
    ...rest
}: TextProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTextFrameProps);

    return (
        <StyledText
            {...(variant !== undefined ? { $variant: variant } : { $color: color })}
            className={className}
            {...makePropsTransient({ typographyStyle, textWrap })}
            {...frameProps}
        >
            {children}
        </StyledText>
    );
};
