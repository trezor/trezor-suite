import { ReactNode, MouseEvent } from 'react';
import styled, { css } from 'styled-components';
import { TypographyStyle, spacingsPx, typography, typographyStylesBase } from '@trezor/theme';
import { Icon, IconName } from '../../Icon/Icon';

type AProps = {
    $type?: TypographyStyle;
    $variant?: 'default' | 'nostyle' | 'underline';
};

const A = styled.a<AProps>`
    ${({ $type }) => ($type ? typography[$type] : typography.body)}
    text-decoration: none;
    cursor: pointer;
    color: ${({ theme }) => theme.textDefault};
    font-weight: 500;
    display: inline-flex;
    align-items: center;

    gap: ${spacingsPx.xxs};

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

interface LinkProps {
    href?: string;
    target?: string;
    type?: TypographyStyle;
    onClick?: (event: MouseEvent<any>) => void;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle' | 'underline'; // Todo: refactor, variant has different meaning in our design system
    icon?: IconName;
    'data-testid'?: string;
}

const Link = ({
    href,
    target,
    icon,
    type,
    onClick,
    'data-testid': dataTest,
    children,
    className,
    variant,
}: LinkProps) => {
    const iconSize = typographyStylesBase[type || 'body'].fontSize;

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
            $type={type}
            $variant={variant}
            className={className}
        >
            {children}
            {icon && <Icon size={iconSize} name={icon} />}
        </A>
    );
};
export type { LinkProps };
export { Link };
