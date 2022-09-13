import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite/types/suite';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const NavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => (props.active ? props.theme.TYPE_GREEN : props.theme.TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 14px 6px 12px 6px;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? props.theme.BG_GREEN : 'transparent')};
    transition: border-color 0.1s;

    :hover {
        border-bottom: 2px solid ${({ theme, active }) => !active && theme.STROKE_GREY};
    }

    & + & {
        margin-left: 42px;

        @media (max-width: ${variables.SCREEN_SIZE.SM}) {
            margin-left: 30px;
        }
    }
`;

const NavLinkText = styled.div`
    position: relative;
`;

type WalletLayoutNavLinkProps = {
    active: boolean;
    title: ExtendedMessageDescriptor['id'];
    values?: ExtendedMessageDescriptor['values'];
    onClick: () => void;
    'data-test'?: string;
};

export const WalletLayoutNavLink = (props: WalletLayoutNavLinkProps) => {
    const { active, title, onClick, values } = props;
    return (
        <NavLink active={active} onClick={onClick} data-test={props['data-test']}>
            <NavLinkText>
                <Translation id={title} values={values} />
            </NavLinkText>
        </NavLink>
    );
};

const Navigation = styled.div`
    display: flex;
    width: 100%;
    min-height: 57px;
    padding: 0 25px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }

    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

type WalletLayoutNavigationProps = {
    children:
        | React.ReactElement<WalletLayoutNavLinkProps>
        | React.ReactElement<WalletLayoutNavLinkProps>[];
};

export const WalletLayoutNavigation: React.FC<WalletLayoutNavigationProps> = ({ children }) => (
    <Navigation>{children}</Navigation>
);
