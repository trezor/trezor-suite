import styled from 'styled-components';

import { TypographyStyle, typography } from '@trezor/theme';
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
    };

const Heading = styled.h1<HeadingProps>`
    ${({ $typographyStyle }) => typography[$typographyStyle]};
    ${({ align = 'left' }) => `text-align: ${align};`}
    ${withFrameProps}
`;

type HProps = FrameProps & BasicProps;

export const H1 = ({ margin, ...props }: HProps) => (
    <Heading as="h1" {...makePropsTransient({ margin })} $typographyStyle="titleLarge" {...props} />
);
export const H2 = ({ margin, ...props }: HProps) => (
    <Heading
        as="h2"
        {...makePropsTransient({ margin })}
        $typographyStyle="titleMedium"
        {...props}
    />
);
export const H3 = ({ margin, ...props }: HProps) => (
    <Heading as="h3" {...makePropsTransient({ margin })} $typographyStyle="titleSmall" {...props} />
);
