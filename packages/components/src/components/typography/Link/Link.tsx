import { ReactNode, MouseEvent } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Icon, IconProps } from '../../assets/Icon/Icon';
import { TypographyStyle, spacings, typography, typographyStylesBase } from '@trezor/theme';

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

const IconWrapper = styled.div`
    margin-left: ${spacings.xxs};
`;

interface LinkProps {
    href?: string;
    target?: string;
    type?: TypographyStyle;
    onClick?: (event: MouseEvent<any>) => void;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle' | 'underline';
    icon?: IconProps['icon'];
    iconProps?: IconProps;
    'data-test'?: string;
}

const Link = ({
    href,
    target,
    icon,
    iconProps,
    type,
    onClick,
    'data-test': dataTest,
    children,
    className,
    variant,
}: LinkProps) => {
    const theme = useTheme();

    const iconSize = typographyStylesBase[type || 'body'].fontSize;

    const {
        variant: iconVariant,
        color: iconColor,
        ...restIconVariant
    } = iconProps ?? { variant: undefined };

    return (
        <A
            href={href}
            target={target || '_blank'}
            rel="noreferrer noopener"
            data-test={dataTest}
            onClick={(e: MouseEvent<any>) => {
                e.stopPropagation();
                onClick?.(e);
            }}
            $variant={variant}
            className={className}
        >
            {children}
            {icon && (
                <IconWrapper>
                    <Icon
                        size={iconSize}
                        icon={icon}
                        {...(variant !== undefined
                            ? { variant: iconVariant }
                            : { color: iconColor ?? theme.iconSubdued })}
                        {...restIconVariant}
                    />
                </IconWrapper>
            )}
        </A>
    );
};
export type { LinkProps };
export { Link };
