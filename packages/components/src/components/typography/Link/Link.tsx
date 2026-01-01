import { HTMLProps, MouseEvent, ReactNode } from 'react';

import styled from 'styled-components';

import { TransientProps } from '../../../utils/transientProps';
import { allowedTextTextProps } from '../Text/Text';
import {
    TextProps as TextPropsCommon,
    TextPropsKeys,
    pickAndPrepareTextProps,
    withTextProps,
} from '../utils';

export const allowedLinkTextProps = [
    'typographyStyle',
    'textWrap',
] as const satisfies TextPropsKeys[];
type AllowedLinkTextProps = Pick<TextPropsCommon, (typeof allowedLinkTextProps)[number]>;

type AProps = TransientProps<AllowedLinkTextProps>;

const A = styled.a<AProps>`
    background-color: unset;
    border: unset;
    text-decoration: underline;
    color: inherit;

    &:hover {
        text-decoration: none;
    }

    ${withTextProps}
`;

export type LinkProps = Pick<HTMLProps<HTMLAnchorElement>, 'href' | 'target' | 'onClick'> &
    AllowedLinkTextProps & {
        children?: ReactNode;
        'data-testid'?: string;
    };

export const Link = ({
    href,
    target,
    onClick,
    'data-testid': dataTest,
    children,
    ...rest
}: LinkProps) => {
    const textProps = pickAndPrepareTextProps(rest, allowedTextTextProps);

    return (
        <A
            href={href}
            target={target ?? '_blank'}
            rel="noreferrer noopener"
            data-testid={dataTest}
            onClick={(e: MouseEvent<any>) => {
                if (onClick !== undefined) {
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            {...textProps}
        >
            {children}
        </A>
    );
};
