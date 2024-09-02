import styled from 'styled-components';

import { Color } from '@trezor/theme';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import { TextProps as TextPropsCommon, TextPropsKeys, withTextProps } from '../utils';

export const allowedHeadingTextProps: TextPropsKeys[] = ['typographyStyle', 'textWrap'];
type AllowedHeadingTextProps = Pick<TextPropsCommon, (typeof allowedHeadingTextProps)[number]>;

export const allowedHeadingFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedHeadingFrameProps)[number]>;

type Align = 'left' | 'center' | 'right';

type HeadingProps = TransientProps<AllowedFrameProps> &
    TransientProps<AllowedHeadingTextProps> & {
        $align?: Align;
        $color?: Color;
    };

const Heading = styled.h1<HeadingProps>`
    ${({ $color, theme }) => $color && `color: ${theme[$color]}`};
    ${({ $align = 'left' }) => `text-align: ${$align};`}

    ${withTextProps}
    ${withFrameProps}
`;

type HProps = AllowedFrameProps &
    AllowedHeadingTextProps & {
        color?: Color;
        align?: Align;
        children: React.ReactNode;
        onClick?: () => void;
        'data-testid'?: string;
    };

export const H1 = ({ margin, color, align, typographyStyle = 'titleLarge', ...props }: HProps) => (
    <Heading
        as="h1"
        {...makePropsTransient({ margin, color, align, typographyStyle })}
        {...props}
    />
);

export const H2 = ({ margin, color, align, typographyStyle = 'titleMedium', ...props }: HProps) => (
    <Heading
        as="h2"
        {...makePropsTransient({ margin, color, align, typographyStyle })}
        {...props}
    />
);

export const H3 = ({ margin, color, align, typographyStyle = 'titleSmall', ...props }: HProps) => (
    <Heading
        as="h3"
        {...makePropsTransient({ margin, color, align, typographyStyle })}
        {...props}
    />
);
