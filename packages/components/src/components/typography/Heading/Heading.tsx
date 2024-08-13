import styled from 'styled-components';

import { Color, TypographyStyle, typography } from '@trezor/theme';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';

export const allowedHeadingFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedHeadingFrameProps)[number]>;

type Align = 'left' | 'center' | 'right';

type HeadingProps = TransientProps<AllowedFrameProps> & {
    $align?: Align;
    $typographyStyle: TypographyStyle;
    $color?: Color;
};

const Heading = styled.h1<HeadingProps>`
    ${({ $color, theme }) => $color && `color: ${theme[$color]}`};
    ${({ $typographyStyle }) => typography[$typographyStyle]};
    ${({ $align = 'left' }) => `text-align: ${$align};`}
    ${withFrameProps}
`;

type HProps = AllowedFrameProps & {
    color?: Color;
    align?: Align;
    children: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
};

export const H1 = ({ margin, color, align, ...props }: HProps) => (
    <Heading
        as="h1"
        {...makePropsTransient({ margin, color, align })}
        $typographyStyle="titleLarge"
        {...props}
    />
);

export const H2 = ({ margin, color, align, ...props }: HProps) => (
    <Heading
        as="h2"
        {...makePropsTransient({ margin, color, align })}
        $typographyStyle="titleMedium"
        {...props}
    />
);

export const H3 = ({ margin, color, align, ...props }: HProps) => (
    <Heading
        as="h3"
        {...makePropsTransient({ margin, color, align })}
        $typographyStyle="titleSmall"
        {...props}
    />
);
