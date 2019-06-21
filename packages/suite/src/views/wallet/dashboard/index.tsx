import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { State } from '@suite-types/index';
// import Content from '@wallet-components/Content';
import { H4, P, CoinLogo } from '@trezor/components';
import Link from '@suite-components/Link';
import Layout from '@wallet-components/Layout';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@wallet-views/messages';
import NETWORKS from '@suite-config/networks';
import EXTERNAL_COINS from '@suite-config/externalCoins';
import { getRoute } from '@suite/utils/suite/router';
import l10nMessages from './index.messages';

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

interface Props {
    settings: State['wallet']['settings'];
}

const Dashboard = (props: Props) => {
    const isEmpty = () => {
        const numberOfVisibleNetworks = NETWORKS.filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !props.settings.hiddenCoins.includes(item.shortcut));
        const { hiddenCoinsExternal } = props.settings;
        const numberOfVisibleNetworksExternal = EXTERNAL_COINS.filter(
            item => !item.isHidden,
        ).filter(item => !hiddenCoinsExternal.includes(item.id));

        return numberOfVisibleNetworks.length <= 0 && numberOfVisibleNetworksExternal.length <= 0;
    };

    return (
        // <Content>
        <Layout>
            <Wrapper>
                <Row data-test="Dashboard__page__content">
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
                        {NETWORKS.filter(item => !item.isHidden)
                            .filter(item => !props.settings.hiddenCoins.includes(item.shortcut))
                            .map(network => (
                                // TODO: build network account url in router utils
                                <Link
                                    key={network.shortcut}
                                    href={`/wallet/account#/${network.shortcut}/0`}
                                >
                                    <StyledCoinLogo network={network.shortcut} height={32} />
                                </Link>
                            ))}
                    </Coins>
                </Row>
            </Wrapper>
        </Layout>
        // </Content>
    );
};

const mapStateToProps = (state: State) => ({
    settings: state.wallet.settings,
});

export default connect(mapStateToProps)(Dashboard);
