import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { AppState } from '@suite-types/index';
import { colors, icons as ICONS } from '@trezor/components';
import Link from '@suite-components/Link';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@suite-views/index.messages';
import networks from '@suite-config/networks';
import externalCoins from '@suite-config/externalCoins';
import { getRoute } from '@suite/utils/suite/router';
import Divider from '../Divider';
import RowCoin from '../RowCoin';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    width: 100%;
`;

const ExternalWallet = styled.div`
    cursor: pointer;
`;

const StyledLink = styled(Link)`
    &:hover {
        text-decoration: none;
    }
`;

const Empty = styled.span`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50px;
`;

const Gray = styled.span`
    color: ${colors.TEXT_SECONDARY};
`;

interface Props {
    suite: AppState['suite'];
    wallet: AppState['wallet'];
    router: AppState['router'];
}
class CoinMenu extends PureComponent<Props> {
    getOtherCoins() {
        const { hiddenCoinsExternal } = this.props.wallet.settings;
        return externalCoins
            .sort((a, b) => a.order - b.order)
            .filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !hiddenCoinsExternal.includes(item.id))
            .map(coin => {
                const row = (
                    <RowCoin
                        network={{
                            name: coin.coinName,
                            shortcut: coin.id,
                        }}
                        iconRight={{
                            type: "SKIP",
                            color: colors.TEXT_SECONDARY,
                            size: 13,
                        }}
                    />
                );

                if (coin.external)
                    return (
                        <ExternalWallet
                            key={coin.id}
                            // onClick={() => this.props.gotoExternalWallet(coin.id, coin.url)}
                        >
                            {row}
                        </ExternalWallet>
                    );
                return (
                    <StyledLink isGray key={coin.id} href={coin.url} target="_top">
                        {row}
                    </StyledLink>
                );
            });
    }

    getEmptyContent() {
        return (
            <Empty>
                <Gray>
                    <FormattedMessage
                        {...l10nMessages.TR_SELECT_COINS}
                        values={{
                            TR_SELECT_COINS_LINK: (
                                <Link href={getRoute('wallet-settings')}>
                                    <FormattedMessage
                                        {...l10nCommonMessages.TR_SELECT_COINS_LINK}
                                    />
                                </Link>
                            ),
                        }}
                    />{' '}
                </Gray>
            </Empty>
        );
    }

    isTopMenuEmpty() {
        const { hiddenCoins } = this.props.wallet.settings;
        const numberOfVisibleNetworks = networks
            .filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !hiddenCoins.includes(item.shortcut))
            .filter(item => !hiddenCoins.includes(item.shortcut));

        return numberOfVisibleNetworks.length <= 0;
    }

    isBottomMenuEmpty() {
        // TODO
        const { hiddenCoinsExternal } = this.props.wallet.settings;
        const numberOfVisibleNetworks = externalCoins
            .filter(item => !item.isHidden)
            .filter(item => !hiddenCoinsExternal.includes(item.id));

        return numberOfVisibleNetworks.length <= 0;
    }

    isMenuEmpty() {
        return this.isTopMenuEmpty() && this.isBottomMenuEmpty();
    }

    render() {
        const { hiddenCoins } = this.props.wallet.settings;
        return (
            <Wrapper data-test="Main__page__coin__menu">
                {this.isMenuEmpty() || (this.isTopMenuEmpty() && this.getEmptyContent())}
                {networks
                    .filter(item => !item.isHidden) // hide coins globally in config
                    .filter(item => !hiddenCoins.includes(item.shortcut)) // hide coins by user settings
                    .sort((a, b) => a.order - b.order)
                    .map(item => (
                        <StyledLink
                            key={item.shortcut}
                            href={getRoute('wallet-account', {
                                coin: item.shortcut,
                                accountId: '0',
                            })}
                        >
                            <RowCoin
                                network={{
                                    name: item.name,
                                    shortcut: item.shortcut,
                                }}
                            />
                        </StyledLink>
                    ))}
                {!this.isMenuEmpty() && (
                    <Divider
                        testId="Main__page__coin__menu__divider"
                        textLeft={<FormattedMessage {...l10nMessages.TR_OTHER_COINS} />}
                        hasBorder
                    />
                )}
                {this.isBottomMenuEmpty() && this.getEmptyContent()}
                {!this.isBottomMenuEmpty() && this.getOtherCoins()}
            </Wrapper>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(CoinMenu);
