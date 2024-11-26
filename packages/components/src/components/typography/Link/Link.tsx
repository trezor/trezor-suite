import { ReactNode, MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { spacingsPx, typographyStylesBase } from '@trezor/theme';

import { Icon, IconName } from '../../Icon/Icon';
import {
    pickAndPrepareTextProps,
    TextProps as TextPropsCommon,
    TextPropsKeys,
    withTextProps,
} from '../utils';
import { allowedTextTextProps } from '../Text/Text';
import { TransientProps } from '../../../utils/transientProps';

export const allowedLinkTextProps = [
    'typographyStyle',
    'textWrap',
] as const satisfies TextPropsKeys[];
type AllowedLinkTextProps = Pick<TextPropsCommon, (typeof allowedLinkTextProps)[number]>;

type AProps = TransientProps<AllowedLinkTextProps> & {
    $variant?: 'default' | 'nostyle' | 'underline';
};

const A = styled.a<AProps>`
    text-decoration: none;
    cursor: pointer;
    color: ${({ theme }) => theme.textDefault};
    font-weight: 500;
    display: inline-flex;
    align-items: center;

    gap: ${spacingsPx.xxs};
    ${withTextProps}

    &:hover {
        text-decoration: underline;
    }

    ${({ $variant }) =>
        $variant === 'underline' &&
        css`
            text-decoration: underline;
        `}

    ${({ $variant }) =>
        $variant === 'nostyle' &&
        css`
            color: inherit;
            font-weight: inherit;

            &:visited,
            &:active,
            &:hover {
                text-decoration: none;
                color: inherit;
            }
        `}
`;

type LinkProps = AllowedLinkTextProps & {
    href?: string;
    target?: string;
    onClick?: (event: MouseEvent<any>) => void;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle' | 'underline'; // Todo: refactor, variant has different meaning in our design system
    icon?: IconName;
    'data-testid'?: string;
};

const Link = ({
    href,
    target,
    icon,
    onClick,
    'data-testid': dataTest,
    children,
    className,
    variant,
    typographyStyle = 'body',
    ...rest
}: LinkProps) => {
    const textProps = pickAndPrepareTextProps({ ...rest, typographyStyle }, allowedTextTextProps);
    const iconSize = typographyStylesBase[typographyStyle].fontSize;

    return (
        <A
            href={href}
            target={target || '_blank'}
            rel="noreferrer noopener"
            data-testid={dataTest}
            onClick={(e: MouseEvent<any>) => {
                e.stopPropagation();
                onClick?.(e);
            }}
            $variant={variant}
            className={className}
            {...textProps}
        >
            {children}
            {icon && <Icon size={iconSize} name={icon} />}
        </A>
    );
};
export type { LinkProps };
export { Link };
