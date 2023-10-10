import { ReactNode, MouseEvent } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Icon, IconProps } from '../../assets/Icon/Icon';
import { FONT_SIZE } from '../../../config/variables';
import { ParagraphSize } from '../../../support/types';

const A_SIZES = {
    normal: FONT_SIZE.NORMAL,
    small: FONT_SIZE.SMALL,
    tiny: FONT_SIZE.TINY,
};

const A = styled.a<LinkProps>`
    font-size: ${props => (props.size ? A_SIZES[props.size] : 'inherit')};
    text-decoration: none;
    cursor: pointer;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
    margin-left: 4px;
`;

interface LinkProps {
    href?: string;
    to?: any;
    target?: string;
    size?: ParagraphSize;
    onClick?: (event: MouseEvent<any>) => void;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle' | 'underline';
    icon?: IconProps['icon'];
    iconProps?: IconProps;
}

const Link = ({ icon, iconProps, ...props }: LinkProps) => {
    const theme = useTheme();
    return (
        <A
            href={props.href}
            target={props.target || '_blank'}
            rel="noreferrer noopener"
            {...props} // make sure {...props} is passed before calling onCLick()
            onClick={(e: MouseEvent<any>) => {
                // if the user passed custom onClick action, run it first
                if (props.onClick) {
                    props.onClick(e);
                }
                // Prevent events from bubbling to the parent element.
                // E.g. we don't want the checkbox to be checked when user clicks on link in checkbox label
                e.stopPropagation();
            }}
        >
            {props.children}
            {icon && (
                <IconWrapper>
                    <Icon
                        size={props.size ? Number(A_SIZES[props.size].replace('px', '')) : 24}
                        icon={icon}
                        color={theme.TYPE_DARK_GREY}
                        {...iconProps}
                    />
                </IconWrapper>
            )}
        </A>
    );
};
export type { LinkProps };
export { Link };
