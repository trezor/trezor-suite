import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import { toInternalRoute } from '@suite-utils/router';
import { AppState } from '@suite-types';

const { FONT_WEIGHT, FONT_SIZE, SCREEN_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    overflow-y: hidden;
    overflow-x: auto;
    padding: 0px 30px 0 35px;
    height: 70px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    background: ${colors.WHITE};
    position: relative;
    cursor: pointer;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        justify-content: space-between;
    }

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        padding: 0px 16px;
    }
`;

const StyledNavLink = styled.div<{ active: boolean }>`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.TOP_MENU};
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px 35px;
    display: flex;
    height: 100%;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? colors.GREEN_PRIMARY : colors.WHITE)};

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        padding: 20px 10px;
    }

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        font-size: ${FONT_SIZE.BASE};
        padding: 20px 10px;
    }

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
    padding-top: 4px;
`;

interface NavigationItem {
    title: React.ReactNode;
    route: string;
    isHidden?: (symbol: string) => boolean;
}

interface Props {
    items: NavigationItem[];
    router: AppState['router'];
}

const TopNavigation = (props: Props) => {
    const { pathname, params } = props.router;
    const currentPath = pathname;
    if (!params.symbol) return <>Invalid account</>;

    return (
        <Wrapper>
            {props.items.map(item => {
                // show item if isHidden() returns false or when isHidden func is not defined
                if ((item.isHidden && !item.isHidden(params.symbol!)) || !item.isHidden) {
                    return (
                        <StyledNavLink
                            key={item.route}
                            active={toInternalRoute(currentPath) === item.route}
                            onClick={() => goto(item.route, true)}
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

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

export default connect(mapStateToProps)(TopNavigation);
