import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Icon } from '@trezor/components-v2';
import { ITEMS } from '@wallet-config/menu';
import * as routerActions from '@suite-actions/routerActions';
import { findRoute } from '@suite-utils/router';
import { AppState, Dispatch } from '@suite-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    padding: 10px 0 0 0;
    cursor: pointer;
    flex-direction: column;
`;

const StyledNavLink = styled.div<{ active: boolean }>`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_SECONDARY};
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    &.active,
    &:hover {
        color: ${colors.TEXT_PRIMARY};
    }

    &:first-child,
    &:last-child {
        margin-left: 0px;
    }
`;

const Text = styled.div`
    padding-left: 5px;
`;

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = {} & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AccountNavigation = (props: Props) => {
    const { pathname, params, app } = props.router;
    const currentRoute = findRoute(pathname);
    if (app !== 'wallet' || !params) return <>Invalid account</>;

    return (
        <Wrapper>
            {ITEMS.map(item => {
                if (!item.isHidden(params.symbol)) {
                    return (
                        <StyledNavLink
                            key={item.route}
                            active={currentRoute ? currentRoute.name === item.route : false}
                            onClick={() => props.goto(item.route, undefined, true)}
                        >
                            <Icon size={10} icon={item.icon} />
                            <Text>{item.title}</Text>
                        </StyledNavLink>
                    );
                }
                return null;
            })}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountNavigation);
