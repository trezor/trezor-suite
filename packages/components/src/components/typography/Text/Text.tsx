import styled from 'styled-components';
import { UIVariant } from '../../../config/types';
import { CSSColor, Color, Colors, TypographyStyle, typography } from '@trezor/theme';
import { ReactNode } from 'react';
import { TransientProps } from '../../../utils/transientProps';

export type TextVariant = Extract<
    UIVariant,
    'primary' | 'tertiary' | 'info' | 'warning' | 'destructive'
>;

type ExclusiveColorOrVariant =
    | { variant?: TextVariant; color?: undefined }
    | {
          variant?: undefined;
          /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
          color?: string;
      };

const variantColorMap: Record<TextVariant, Color> = {
    primary: 'textPrimaryDefault',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
};

type ColorProps = {
    theme: Colors;
} & TransientProps<ExclusiveColorOrVariant>;

const getColorForTextVariant = ({
    $variant,
    theme,
    $color,
}: ColorProps): CSSColor | 'inherit' | string => {
    if ($color !== undefined) {
        return $color;
    }

    return $variant === undefined ? 'inherit' : theme[variantColorMap[$variant]];
};

type StyledTextProps = {
    $typographyStyle?: TypographyStyle;
} & ExclusiveColorOrVariant;

const StyledText = styled.span<StyledTextProps>`
    color: ${getColorForTextVariant};
    ${({ $typographyStyle }) => ($typographyStyle ? typography[$typographyStyle] : '')}
`;

type TextProps = {
    children: ReactNode;
    className?: string;
    typographyStyle?: TypographyStyle;
} & ExclusiveColorOrVariant;

export const Text = ({ variant, color, children, className, typographyStyle }: TextProps) => {
    return (
        <StyledText
            {...(variant !== undefined ? { $variant: variant } : { $color: color })}
            className={className}
            $typographyStyle={typographyStyle}
        >
            {children}
        </StyledText>
    );
};
