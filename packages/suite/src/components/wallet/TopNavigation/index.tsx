import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { State } from '@suite-types/index';
import { goto } from '@suite-actions/routerActions';
import { getPrefixedURL } from '@suite-utils/nextjs';

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
    isHidden?: (coinShortcut: string) => boolean;
}

interface Props {
    items: NavigationItem[];
    router: State['router'];
}

const TopNavigation = (props: Props) => {
    const { pathname, params } = props.router;
    const currentPath =
        pathname[pathname.length - 1] === '/'
            ? pathname.substring(0, pathname.length - 1)
            : pathname;

    return (
        <Wrapper>
            {props.items.map(item => {
                // show item if isHidden() returns false or when isHidden func is not defined
                if ((item.isHidden && !item.isHidden(params.coin)) || !item.isHidden) {
                    console.log(getPrefixedURL(item.route));

                    return (
                        <StyledNavLink
                            key={item.route}
                            active={currentPath === getPrefixedURL(item.route)}
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

const mapStateToProps = (state: State) => ({
    router: state.router,
});

export default connect(mapStateToProps)(TopNavigation);
