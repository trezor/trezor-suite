import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const NavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${({ active, theme }) => (active ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 14px 6px 12px;
    white-space: nowrap;
    border-bottom: 2px solid ${({ active, theme }) => (active ? theme.BG_GREEN : 'transparent')};
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
    z-index: 1;
`;

const Badge = styled.span`
    position: absolute;
    top: -12px;
    right: -24px;
    padding: 2px 4px 0;
    border-radius: 4px;
    background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: 10px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    letter-spacing: 0.2px;
    cursor: default;
    pointer-events: none;
    z-index: -1;
`;

export interface WalletLayoutNavLinkProps {
    active: boolean;
    title: ExtendedMessageDescriptor['id'];
    values?: ExtendedMessageDescriptor['values'];
    badge?: ExtendedMessageDescriptor['id'];
    onClick: () => void;
    'data-test'?: string;
}

export const WalletLayoutNavLink = (props: WalletLayoutNavLinkProps) => {
    const { active, title, onClick, values, badge } = props;

    return (
        <NavLink active={active} onClick={onClick} data-test={props['data-test']}>
            <NavLinkText>
                <Translation id={title} values={values} />
                {badge && (
                    <Badge>
                        <Translation id={badge} />
                    </Badge>
                )}
            </NavLinkText>
        </NavLink>
    );
};
