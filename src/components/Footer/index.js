/* @flow */

import styled from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';
import Link from 'components/Link';
import { getYear } from 'date-fns';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import colors from 'config/colors';
import * as LogActions from 'actions/LogActions';

type Props = {
    opened: boolean,
    toggle: () => any,
}

const Wrapper = styled.div`
    width: 100%;
    font-size: 12px;
    background: ${colors.LANDING};
    color: ${colors.TEXT_SECONDARY};
    padding: 22px 48px;
    display: flex;
    border-top: 1px solid ${colors.BACKGROUND};
`;

const StyledLink = styled(Link)`
    margin: 0 6px;
    margin-right: 20px;
`;

const Copy = styled.div`
    margin-right: 20px;
`;

const Footer = ({ opened, toggle }: Props) => (
    <Wrapper>
        <Copy title={window.COMMITHASH}>&copy; {getYear(new Date())}</Copy>
        <StyledLink href="http://satoshilabs.com" isGreen>SatoshiLabs</StyledLink>
        <StyledLink href="/assets/tos.pdf" isGreen>Terms</StyledLink>
        <StyledLink onClick={toggle} isGreen>{ opened ? 'Hide Log' : 'Show Log' }</StyledLink>
    </Wrapper>
);

Footer.propTypes = {
    opened: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    opened: state.log.opened,
});

const mapDispatchToProps = dispatch => ({
    toggle: bindActionCreators(LogActions.toggle, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
