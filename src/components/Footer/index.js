/* @flow */

import styled from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';
import Link from 'components/Link';
import { getYear } from 'date-fns';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';
import * as LogActions from 'actions/LogActions';

declare var COMMITHASH: string;

type Props = {
    opened: boolean,
    isLanding: boolean,
    toggle: () => any,
}

const Wrapper = styled.div`
    width: 100%;
    font-size: ${FONT_SIZE.SMALL};
    background: ${colors.LANDING};
    color: ${colors.TEXT_SECONDARY};
    padding: 10px 30px;
    display: flex;
    height: 59px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid ${colors.BACKGROUND};

    @media all and (max-width: 850px) {
        justify-content: center;
    }
`;

const StyledLink = styled(Link)`
    margin: 0 10px;
    white-space: nowrap;
`;

const Copy = styled.div`
    white-space: nowrap;
    margin-right: 10px;
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    white-space: nowrap;
    margin: 0 10px;
`;

const Footer = ({ opened, toggle, isLanding }: Props) => (
    <Wrapper>
        <Left>
            <Copy title={COMMITHASH}>&copy; {getYear(new Date())}</Copy>
            <StyledLink href="http://satoshilabs.com" isGreen>SatoshiLabs</StyledLink>
            <StyledLink href="./assets/tos.pdf" isGreen>Terms</StyledLink>
            <StyledLink onClick={toggle} isGreen>{ opened ? 'Hide Log' : 'Show Log' }</StyledLink>
        </Left>
        {!isLanding && (
            <Right>
                Exchange rates by <Link href="https://www.coingecko.com" isGreen>Coingecko</Link>
            </Right>
        )}
    </Wrapper>
);

Footer.propTypes = {
    opened: PropTypes.bool.isRequired,
    isLanding: PropTypes.bool,
    toggle: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    opened: state.log.opened,
});

const mapDispatchToProps = dispatch => ({
    toggle: bindActionCreators(LogActions.toggle, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
