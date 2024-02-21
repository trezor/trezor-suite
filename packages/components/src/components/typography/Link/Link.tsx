import { ReactNode, MouseEvent } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Icon, IconProps } from '../../assets/Icon/Icon';
import { TypographyStyle, spacings, typography, typographyStylesBase } from '@trezor/theme';

const A = styled.a<LinkProps>`
    ${({ type }) => (type ? typography[type] : typography.body)}
    text-decoration: none;
    cursor: pointer;
    color: ${({ theme }) => theme.textDefault};
    font-weight: 500;
    display: inline-flex;
    align-items: center;

    &:hover {
        text-decoration: underline;
    }

    ${props =>
        props.variant === 'underline' &&
        css`
            text-decoration: underline;
        `}

    ${props =>
        props.variant === 'nostyle' &&
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

const IconWrapper = styled.div`
    margin-left: ${spacings.xxs};
`;

interface LinkProps {
    href?: string;
    to?: any;
    target?: string;
    type?: TypographyStyle;
    onClick?: (event: MouseEvent<any>) => void;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle' | 'underline';
    icon?: IconProps['icon'];
    iconProps?: IconProps;
    'data-test-id'?: string;
}

const Link = ({
    href,
    target,
    icon,
    iconProps,
    type,
    onClick,
    'data-test-id': dataTest,
    ...props
}: LinkProps) => {
    const theme = useTheme();

    const iconSize = typographyStylesBase[type || 'body'].fontSize;

    return (
        <A
            href={href}
            target={target || '_blank'}
            rel="noreferrer noopener"
            data-test-id={dataTest}
            onClick={(e: MouseEvent<any>) => {
                e.stopPropagation();
                onClick?.(e);
            }}
            {...props}
        >
            {props.children}
            {icon && (
                <IconWrapper>
                    <Icon size={iconSize} icon={icon} color={theme.iconSubdued} {...iconProps} />
                </IconWrapper>
            )}
        </A>
    );
};
export type { LinkProps };
export { Link };
