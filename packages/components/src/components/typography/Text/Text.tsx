import styled from 'styled-components';
import { UIVariant } from '../../../config/types';
import { CSSColor, Color, Colors, TypographyStyle, typography } from '@trezor/theme';
import { ReactNode } from 'react';

export type TextVariant = Extract<UIVariant, 'primary' | 'info' | 'warning' | 'destructive'>;

const variantColorMap: Record<TextVariant, Color> = {
    primary: 'textPrimaryDefault',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
};

type ColorProps = {
    $variant?: TextVariant;
    theme: Colors;
    $color?: string;
};

const getColor = ({ $variant, theme, $color }: ColorProps): CSSColor | 'inherit' | string => {
    if ($color !== undefined) {
        return $color;
    }

    return $variant === undefined ? 'inherit' : theme[variantColorMap[$variant]];
};

const StyledText = styled.span<{
    $variant?: TextVariant;
    $color?: string;
    $typographyStyle?: TypographyStyle;
}>`
    color: ${getColor};
    ${({ $typographyStyle }) => ($typographyStyle ? typography[$typographyStyle] : '')}
`;

type TextProps = {
    children: ReactNode;
    className?: string;
    typographyStyle?: TypographyStyle;
} & (
    | { variant?: TextVariant; color?: undefined }
    | {
          variant?: undefined;
          /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
          color?: string;
      }
);

export const Text = ({ variant, color, children, className, typographyStyle }: TextProps) => {
    return (
        <StyledText
            $variant={variant}
            $color={color}
            className={className}
            $typographyStyle={typographyStyle}
        >
            {children}
        </StyledText>
    );
};
