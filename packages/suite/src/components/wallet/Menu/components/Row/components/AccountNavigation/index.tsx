import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { items } from '@wallet-config/menu';
import * as routerActions from '@suite-actions/routerActions';
import { findRoute } from '@suite-utils/router';
import { AppState, Dispatch } from '@suite-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    padding: 5px 0 0 39px;
    cursor: pointer;
    flex-direction: column;
`;

const StyledNavLink = styled.div<{ active: boolean }>`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_SECONDARY};
    display: flex;
    white-space: nowrap;

    &.active,
    &:hover {
        color: ${colors.TEXT_PRIMARY};
    }

    &:first-child {
        margin-left: 0px;
    }

    &:last-child {
        margin-right: 0px;
    }
`;

const LinkContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
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
            {items.map(item => {
                // show item if isHidden() returns false or when isHidden func is not defined
                if ((item.isHidden && !item.isHidden(params.symbol)) || !item.isHidden) {
                    return (
                        <StyledNavLink
                            key={item.route}
                            active={currentRoute ? currentRoute.name === item.route : false}
                            onClick={() => props.goto(item.route, undefined, true)}
                        >
                            <LinkContent>{item.title}</LinkContent>
                        </StyledNavLink>
                    );
                }
                return null;
            })}
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AccountNavigation);
