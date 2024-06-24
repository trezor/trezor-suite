import styled from 'styled-components';

import { Color, TypographyStyle, typography } from '@trezor/theme';
import { FrameProps, TransientFrameProps, withFrameProps } from '../../common/frameProps';
import { makePropsTransient } from '../../../utils/transientProps';

type Align = 'left' | 'center' | 'right';

type BasicProps = {
    children: React.ReactNode;
    'data-test'?: string;
    align?: Align;
    onClick?: () => void;
};

type HeadingProps = TransientFrameProps &
    BasicProps & {
        $typographyStyle: TypographyStyle;
        $color?: Color;
    };

const Heading = styled.h1<HeadingProps>`
    ${({ $color, theme }) => $color && `color: ${theme[$color]}`};
    ${({ $typographyStyle }) => typography[$typographyStyle]};
    ${({ align = 'left' }) => `text-align: ${align};`}
    ${withFrameProps}
`;

type HProps = FrameProps & BasicProps & { color?: Color };

export const H1 = ({ margin, color, ...props }: HProps) => (
    <Heading
        as="h1"
        {...makePropsTransient({ margin, color })}
        $typographyStyle="titleLarge"
        {...props}
    />
);
export const H2 = ({ margin, color, ...props }: HProps) => (
    <Heading
        as="h2"
        {...makePropsTransient({ margin, color })}
        $typographyStyle="titleMedium"
        {...props}
    />
);
export const H3 = ({ margin, color, ...props }: HProps) => (
    <Heading
        as="h3"
        {...makePropsTransient({ margin, color })}
        $typographyStyle="titleSmall"
        {...props}
    />
);
