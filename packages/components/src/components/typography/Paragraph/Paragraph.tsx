import React from 'react';
import styled from 'styled-components';
import { Text, TextVariant, textVariants, allowedTextTextProps } from '../Text/Text';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import { TextProps, TextPropsKeys, withTextProps } from '../utils';

export const allowedParagraphTextProps: TextPropsKeys[] = [...allowedTextTextProps, 'align'];
type AllowedParagraphTextProps = Pick<TextProps, (typeof allowedParagraphTextProps)[number]>;

export const allowedParagraphFrameProps = [
    'margin',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedParagraphFrameProps)[number]>;

export const paragraphVariants = textVariants;

export type ParagraphProps = AllowedFrameProps &
    AllowedParagraphTextProps & {
        variant?: TextVariant;
        className?: string;
        'data-testid'?: string;
        children: React.ReactNode;
    };

const P = styled.p<
    TransientProps<AllowedFrameProps> & TransientProps<Pick<AllowedParagraphTextProps, 'align'>>
>`
    ${withTextProps}
    ${withFrameProps}
`;

export const Paragraph = ({
    className,
    typographyStyle = 'body',
    textWrap,
    align,
    'data-testid': dataTest,
    children,
    variant,
    ...rest
}: ParagraphProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedParagraphFrameProps);

    return (
        <P
            className={className}
            data-testid={dataTest}
            {...makePropsTransient({ align })}
            {...frameProps}
        >
            <Text typographyStyle={typographyStyle} textWrap={textWrap} variant={variant}>
                {children}
            </Text>
        </P>
    );
};
