/* @flow */
import React from 'react';
import styled from 'styled-components';
import Content from 'views/Wallet/components/Content';
import { NavLink } from 'react-router-dom';
import { CoinLogo, H4, P } from 'trezor-ui-components';

import { FormattedMessage } from 'react-intl';
import l10nMessages from './index.messages';
import type { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    padding: 50px 0;

    flex-direction: column;
    align-items: center;
`;

const StyledP = styled(P)`
    && {
        padding: 0 0 15px 0;
        text-align: center;
    }
`;

const Coins = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const StyledNavLink = styled(NavLink)`
    margin-right: 10px;

    &:last-child {
        margin-right: 0px;
    }
`;

const StyledCoinLogo = styled(CoinLogo)`
    opacity: 0.7;
    transition: opacity 0.2s ease-in-out;

    &:hover {
        opacity: 1;
    }
`;

const getBaseUrl = device => {
    let baseUrl = '';
    if (device && device.features) {
        baseUrl = `/device/${device.features.device_id}`;
        if (device.instance) {
            baseUrl += `:${device.instance}`;
        }
    }

    return baseUrl;
};
const Dashboard = (props: Props) => (
    <Content>
        <Wrapper>
            <Row data-test="Dashboard__page__content">
                <H4>
                    <FormattedMessage {...l10nMessages.TR_PLEASE_SELECT_YOUR} />
                </H4>
                <StyledP>
                    <FormattedMessage {...l10nMessages.TR_YOU_WILL_GAIN_ACCESS} />
                </StyledP>
                <Coins>
                    {props.localStorage.config.networks
                        .filter(item => !item.isHidden)
                        .filter(item => props.wallet.hiddenCoins.includes(item.shortcut))
                        .map(network => (
                            <StyledNavLink
                                key={network.shortcut}
                                to={`${getBaseUrl(props.wallet.selectedDevice)}/network/${
                                    network.shortcut
                                }/account/0`}
                            >
                                <StyledCoinLogo network={network.shortcut} height={32} />
                            </StyledNavLink>
                        ))}
                </Coins>
            </Row>
        </Wrapper>
    </Content>
);

export default Dashboard;
