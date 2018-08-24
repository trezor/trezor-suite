import styled from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';
import Link from 'components/Link';
import { getYear } from 'date-fns';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';


import colors from 'config/colors';
import * as LogActions from 'actions/LogActions';

const Wrapper = styled.div`
    width: 100%;
    font-size: 12px;
    color: ${colors.TEXT_SECONDARY};
    padding: 22px 48px;
    border-top: 1px solid ${colors.DIVIDER};
    display: flex;
`;

const LinkWrapper = styled(Link)`
    margin: 0 6px;
    margin-right: 20px;
`;

const Copy = styled.div`
    margin-right: 20px;
`;

const Footer = ({ toggle }) => (
    <Wrapper>
        <Copy>&copy; {getYear(new Date())}</Copy>
        <LinkWrapper href="http://satoshilabs.com" target="_blank" rel="noreferrer noopener" className="satoshi" isGreen>SatoshiLabs</LinkWrapper>
        <LinkWrapper href="tos.pdf" target="_blank" rel="noreferrer noopener" isGreen>Terms</LinkWrapper>
        <LinkWrapper onClick={toggle} isGreen>Show Log</LinkWrapper>
    </Wrapper>
);

Footer.propTypes = {
    toggle: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
    toggle: bindActionCreators(LogActions.toggle, dispatch),
});

export default connect(null, mapDispatchToProps)(Footer);
