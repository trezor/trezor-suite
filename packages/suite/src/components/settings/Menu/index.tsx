import React from 'react';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import { bindActionCreators } from 'redux';

import { H2, Icon, Link, colors, variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { AppState, Dispatch } from '@suite-types';
import { IconType } from '@trezor/components/lib/support/types';
import { Translation } from '@suite-components/Translation';

import { SUPPORT_URL } from '@suite-constants/urls';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps>;

const LEFT_PADDING = '10px';
const TEXT_COLOR = colors.BLACK25;
const ACTIVE_TEXT_COLOR = colors.BLACK0;
const SECONDARY_COLOR = colors.BLACK96;

const ContentWrapper = styled.div`
    padding: 0 ${LEFT_PADDING};
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Bottom = styled.div`
    margin-top: auto;
`;

const Items = styled.div``;

const ItemWrapper = styled.div<{ isActive?: boolean }>`
    width: 100%;
    height: 50px;
    border-radius: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? ACTIVE_TEXT_COLOR : TEXT_COLOR)};
    /* todo: not in variables */
    font-weight: ${({ isActive }) => (isActive ? 500 : variables.FONT_WEIGHT.REGULAR)};
    display: flex;
    align-items: center;

    ${({ isActive }) =>
        isActive &&
        css`
            background-color: ${SECONDARY_COLOR};
        `}
`;

const StyledIcon = styled(Icon)`
    padding-left: ${LEFT_PADDING};
    padding-right: 10px;
    margin-bottom: 2px;
`;

interface ItemProps {
    label: React.ReactNode;
    icon: IconType;
    onClick?: () => void;
    isActive?: boolean;
    ['data-test']: string;
}

const Item = ({ label, icon, onClick, isActive, ...props }: ItemProps) => (
    <ItemWrapper onClick={onClick} data-test={props['data-test']} isActive={isActive}>
        <StyledIcon color={isActive ? ACTIVE_TEXT_COLOR : TEXT_COLOR} icon={icon} size={18} />
        {label}
    </ItemWrapper>
);

const ITEMS = [
    {
        label: <Translation id="TR_GENERAL" />,
        'data-test': '@settings/menu/general',
        icon: 'SETTINGS',
        route: 'settings-index',
    },
    {
        label: <Translation id="TR_DEVICE" />,
        'data-test': '@settings/menu/device',
        icon: 'TREZOR',
        route: 'settings-device',
    },
    {
        label: <Translation id="TR_COINS" />,
        'data-test': '@settings/menu/wallet',
        icon: 'COINS',
        route: 'settings-wallet',
    },
] as const;

const SettignsMenu = ({ goto, router, openModal }: Props) => {
    return (
        <ContentWrapper>
            <Items>
                {ITEMS.map(i => (
                    <Item
                        key={i.route}
                        {...i}
                        onClick={() => goto(i.route)}
                        isActive={
                            router &&
                            typeof router.route !== 'undefined' &&
                            i.route === router.route.name
                        }
                    />
                ))}
            </Items>

            <Bottom>
                <Items>
                    <Item
                        data-test="@settings/menu/support"
                        icon="SUPPORT"
                        label={
                            <Link variant="nostyle" href={SUPPORT_URL}>
                                <Translation id="TR_SUPPORT" />
                            </Link>
                        }
                    />
                    <Item
                        data-test="@settings/menu/log"
                        icon="LOG"
                        onClick={() => openModal({ type: 'log' })}
                        label={<Translation id="TR_SHOW_LOG" />}
                    />
                </Items>
            </Bottom>
        </ContentWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(SettignsMenu);
