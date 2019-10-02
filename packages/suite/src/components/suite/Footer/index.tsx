import React from 'react';
import styled, { css } from 'styled-components';
import { Link, colors, variables } from '@trezor/components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import * as logActions from '@suite-actions/logActions';
import l10nMessages from './index.messages';
import { AppState, Dispatch } from '@suite-types';

const { FONT_SIZE, SCREEN_SIZE } = variables;
const FOOTER_HEIGHT = '59px';
interface Props {
    isLanding?: boolean;
    opened: boolean;
    toggle: typeof logActions.toggle;
}

const Wrapper = styled.div<Pick<Props, 'isLanding'>>`
    width: 100%;
    font-size: ${FONT_SIZE.SMALL};
    background: ${colors.LANDING};
    color: ${colors.TEXT_SECONDARY};
    padding: 10px 30px;
    height: ${FOOTER_HEIGHT};
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid ${colors.BACKGROUND};
    ${props =>
        !props.isLanding &&
        css`
            max-width: ${SCREEN_SIZE.LG};
        `}
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

const Content = styled.div`
    max-width: ${SCREEN_SIZE.LG};
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    @media all and (max-width: ${SCREEN_SIZE.MD}) {
        justify-content: center;
    }
`;

const Footer = ({ opened, toggle, isLanding = false }: Props) => {
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
        <Wrapper isLanding={isLanding}>
            <Content>
                <Left>
                    <StyledLink href="http://satoshilabs.com" isGreen>
                        SatoshiLabs
                    </StyledLink>
                    <StyledLink href="https://trezor.io/tos" isGreen>
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
            </Content>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    opened: state.log.opened,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    toggle: bindActionCreators(logActions.toggle, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Footer);
