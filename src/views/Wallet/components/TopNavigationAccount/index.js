import styled from 'styled-components';
import React from 'react';
import { NavLink } from 'react-router-dom';
import colors from 'config/colors';
import Indicator from './components/Indicator';

const Wrapper = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    padding: 0px 28px;
    max-width: 600px;
`;

const StyledNavLink = styled(NavLink)`
    font-weight: 500;
    font-size: 14px;
    color: ${colors.TEXT_SECONDARY};
    margin: 0px 4px;
    padding: 20px;

    &.active,
    &:hover {
        transition: all 0.3s ease-in-out;
        color: ${colors.TEXT_PRIMARY};
    }

    &:first-child {
        margin-left: 0px;
    }

    &:last-child {
        margin-right: 0px;
    }
`;


const TopNavigationAccount = (props: any) => {
    const urlParams = props.match.params;
    const basePath = `/device/${urlParams.device}/network/${urlParams.network}/account/${urlParams.account}`;

    return (
        <Wrapper className="account-tabs">
            <StyledNavLink exact to={`${basePath}`}>Summary</StyledNavLink>
            <StyledNavLink to={`${basePath}/send`}>Send</StyledNavLink>
            <StyledNavLink to={`${basePath}/receive`}>Receive</StyledNavLink>
            <Indicator pathname={props.match.pathname} />
        </Wrapper>
    );
};

export default TopNavigationAccount;