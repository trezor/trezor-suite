import styled from 'styled-components';
import { UIVariant } from '../../../config/types';
import { CSSColor, Color, Colors, TypographyStyle, typography } from '@trezor/theme';
import { ReactNode } from 'react';
import { TransientProps } from '../../../utils/transientProps';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../../utils/frameProps';

export const allowedTextFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTextFrameProps)[number]>;

export type TextVariant = Extract<
    UIVariant,
    'primary' | 'secondary' | 'tertiary' | 'info' | 'warning' | 'destructive'
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
    secondary: 'textSecondaryHighlight',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
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
} & ExclusiveColorOrVariant &
    TransientProps<AllowedFrameProps>;

const StyledText = styled.span<StyledTextProps>`
    color: ${getColorForTextVariant};
    ${({ $typographyStyle }) => ($typographyStyle ? typography[$typographyStyle] : '')}

    ${withFrameProps}
`;

type TextProps = {
    children: ReactNode;
    className?: string;
    typographyStyle?: TypographyStyle;
} & ExclusiveColorOrVariant &
    AllowedFrameProps;

export const Text = ({
    variant,
    color,
    children,
    className,
    typographyStyle,
    margin,
}: TextProps) => {
    return (
        <StyledText
            {...(variant !== undefined ? { $variant: variant } : { $color: color })}
            className={className}
            $typographyStyle={typographyStyle}
            $margin={margin}
        >
            {children}
        </StyledText>
    );
};
