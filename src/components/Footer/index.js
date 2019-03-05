/* @flow */

import styled from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';
import Link from 'components/Link';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import colors from 'config/colors';
import { FONT_SIZE, SCREEN_SIZE } from 'config/variables';
import * as LogActions from 'actions/LogActions';
import l10nMessages from './index.messages';

type Props = {
    opened: boolean,
    isLanding: boolean,
    toggle: () => any,
};

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

    @media all and (max-width: ${SCREEN_SIZE.MD}) {
        justify-content: center;
    }
`;

const StyledLink = styled(Link)`
    margin: 0 10px;
    white-space: nowrap;

    &:first-child {
        margin-left: 0;
    }
`;

const Left = styled.div`
    display: flex;
    margin-right: 10px;

    @media all and (max-width: ${SCREEN_SIZE.XS}) {
        margin: 0;
    }
`;

const Right = styled.div``;

const RatesLeft = styled.div`
    @media all and (max-width: ${SCREEN_SIZE.XS}) {
        display: none;
    }
`;

const TranslatorsRight = styled.div`
    @media all and (max-width: ${SCREEN_SIZE.XS}) {
        display: none;
    }
`;

const RatesRight = styled.div`
    display: none;

    @media all and (max-width: ${SCREEN_SIZE.XS}) {
        display: block;
        width: 100%;
    }
`;

const Footer = ({ opened, toggle, isLanding }: Props) => {
    const exchangeRates = (
        <FormattedMessage
            {...l10nMessages.TR_EXCHANGE_RATES_BY}
            values={{
                service: (
                    <Link href="https://www.coingecko.com" isGreen>
                        Coingecko
                    </Link>
                ),
            }}
        />
    );
    return (
        <Wrapper>
            <Left>
                <StyledLink href="http://satoshilabs.com" isGreen>
                    SatoshiLabs
                </StyledLink>
                <StyledLink href="https://trezor.io/static/pdf/tos.pdf" isGreen>
                    <FormattedMessage {...l10nMessages.TR_TERMS} />
                </StyledLink>
                <StyledLink onClick={toggle} isGreen>
                    {opened ? 'Hide Log' : 'Show Log'}
                </StyledLink>
                <RatesLeft>{exchangeRates}</RatesLeft>
            </Left>
            {!isLanding && (
                <Right>
                    <TranslatorsRight>
                        <FormattedMessage
                            {...l10nMessages.TR_WE_THANK_OUR_TRANSLATORS}
                            values={{
                                TR_CONTRIBUTION: (
                                    <Link
                                        href="https://wiki.trezor.io/CrowdIn.com_-_A_tool_for_translation"
                                        isGreen
                                    >
                                        <FormattedMessage {...l10nMessages.TR_CONTRIBUTION} />
                                    </Link>
                                ),
                            }}
                        />
                    </TranslatorsRight>
                    <RatesRight>{exchangeRates}</RatesRight>
                </Right>
            )}
        </Wrapper>
    );
};

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

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Footer);
