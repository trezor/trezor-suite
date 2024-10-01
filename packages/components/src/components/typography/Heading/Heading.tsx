import styled from 'styled-components';

import { Color, TypographyStyle } from '@trezor/theme';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import {
    TextProps as TextPropsCommon,
    TextPropsKeys,
    withTextProps,
    pickAndPrepareTextProps,
} from '../utils';

export const allowedHeadingTextProps: TextPropsKeys[] = [
    'typographyStyle',
    'textWrap',
    'align',
    'ellipsisLineCount',
];
type AllowedHeadingTextProps = Pick<TextPropsCommon, (typeof allowedHeadingTextProps)[number]>;

export const allowedHeadingFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedHeadingFrameProps)[number]>;

type HeadingProps = TransientProps<AllowedFrameProps> &
    TransientProps<AllowedHeadingTextProps> & {
        $color?: Color;
    };

const Heading = styled.h1<HeadingProps>`
    ${({ $color, theme }) => $color && `color: ${theme[$color]}`};

    ${withTextProps}
    ${withFrameProps}
`;

type HProps = AllowedFrameProps &
    AllowedHeadingTextProps & {
        color?: Color;
        children: React.ReactNode;
        className?: string;
        onClick?: () => void;
        'data-testid'?: string;
    };

const createHeading =
    (as: 'h1' | 'h2' | 'h3' | 'h4', defaultTypographyStyle: TypographyStyle) =>
    ({
        color,
        typographyStyle = defaultTypographyStyle,
        onClick,
        'data-testid': dataTestId,
        children,
        className,
        ...rest
    }: HProps) => {
        const frameProps = pickAndPrepareFrameProps(rest, allowedHeadingFrameProps);
        const textProps = pickAndPrepareTextProps(
            { ...rest, typographyStyle },
            allowedHeadingTextProps,
        );

        return (
            <Heading
                as={as}
                onClick={onClick}
                data-testid={dataTestId}
                className={className}
                {...makePropsTransient({ color })}
                {...frameProps}
                {...textProps}
            >
                {children}
            </Heading>
        );
    };

export const H1 = createHeading('h1', 'titleLarge');
export const H2 = createHeading('h2', 'titleMedium');
export const H3 = createHeading('h3', 'titleSmall');
export const H4 = createHeading('h4', 'highlight');
