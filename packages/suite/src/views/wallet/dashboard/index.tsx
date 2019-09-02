import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Content from '@wallet-components/Content';
import { H4, P, CoinLogo } from '@trezor/components';
import Link from '@suite-components/Link';
import Layout from '@wallet-components/Layout';
import Discovery from '@wallet-components/Discovery';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@wallet-views/messages';
import { getRoute } from '@suite/utils/suite/router';
import { networks, externalCoins } from '@suite-config';
import l10nMessages from './index.messages';
import { AppState } from '@suite-types';
import { Network } from '@wallet-types';

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
    max-width: 400px;
`;

const StyledCoinLogo = styled(CoinLogo)`
    opacity: 0.7;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }
`;

const StyledH4 = styled(H4)`
    text-align: center;
`;

const StyledLink = styled(Link)`
    margin: 5px;

    &:last-child {
        margin-right: 0;
    }
`;

interface Props {
    settings: AppState['wallet']['settings'];
}

const Dashboard = (props: Props) => {
    const isEmpty = () => {
        const numberOfVisibleNetworks = networks
            .filter((item: Network) => !item.isHidden) // hide coins globally in config
            .filter(item => !props.settings.hiddenCoins.includes(item.symbol));
        const { hiddenCoinsExternal } = props.settings;
        const numberOfVisibleNetworksExternal = externalCoins
            .filter(item => !item.isHidden)
            .filter(item => !hiddenCoinsExternal.includes(item.id));

        return numberOfVisibleNetworks.length <= 0 && numberOfVisibleNetworksExternal.length <= 0;
    };

    return (
        <Layout>
            <Content>
                <Row data-test="Dashboard__page__content">
                    <Discovery />
                    <StyledH4>
                        {isEmpty() && (
                            <FormattedMessage
                                {...l10nMessages.TR_PLEASE_SELECT_YOUR_EMPTY}
                                values={{
                                    TR_SELECT_COINS_LINK: (
                                        <Link href={getRoute('wallet-settings')}>
                                            <FormattedMessage
                                                {...l10nCommonMessages.TR_SELECT_COINS_LINK}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        )}
                        {!isEmpty() && <FormattedMessage {...l10nMessages.TR_PLEASE_SELECT_YOUR} />}
                    </StyledH4>
                    <StyledP>
                        <FormattedMessage {...l10nMessages.TR_YOU_WILL_GAIN_ACCESS} />
                    </StyledP>
                    <Coins>
                        {networks
                            .filter(item => !item.isHidden)
                            .filter(item => !props.settings.hiddenCoins.includes(item.symbol))
                            .map(network => (
                                <StyledLink
                                    key={`${network.name}-${network.symbol}`}
                                    href={getRoute('wallet-account', {
                                        coin: network.symbol,
                                        accountId: '0',
                                    })}
                                >
                                    <StyledCoinLogo
                                        network={network.symbol === 'test' ? 'btc' : network.symbol}
                                        size={27}
                                    />
                                </StyledLink>
                            ))}
                    </Coins>
                </Row>
            </Content>
        </Layout>
    );
};

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
});

export default connect(mapStateToProps)(Dashboard);
