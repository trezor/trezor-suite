import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { State } from '@suite-types/index';
import { Link, colors, icons as ICONS } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@suite-views/index.messages';
import networks from '@suite-config/networks';
import externalCoins from '@suite-config/externalCoins';
import { goto } from '@suite/actions/suite/routerActions';
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

const StyledLinkEmpty = styled(Link)`
    padding: 0;
`;

const Gray = styled.span`
    color: ${colors.TEXT_SECONDARY};
`;

interface Props {
    suite: State['suite'];
    router: State['router'];
}
class CoinMenu extends PureComponent<Props> {
    getOtherCoins() {
        // TODO
        // const { hiddenCoinsExternal } = this.props.wallet;
        const hiddenCoinsExternal: string[] = [];
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
                            type: ICONS.SKIP,
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
                                <StyledLinkEmpty to="/settings">
                                    <FormattedMessage
                                        {...l10nCommonMessages.TR_SELECT_COINS_LINK}
                                    />
                                </StyledLinkEmpty>
                            ),
                        }}
                    />{' '}
                </Gray>
            </Empty>
        );
    }

    isTopMenuEmpty() {
        // TODO
        // const { hiddenCoins } = this.props.wallet;
        const hiddenCoins: string[] = [];
        const numberOfVisibleNetworks = networks
            .filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !hiddenCoins.includes(item.shortcut))
            .filter(item => !hiddenCoins.includes(item.shortcut));

        return numberOfVisibleNetworks.length <= 0;
    }

    isBottomMenuEmpty() {
        // TODO
        // const { hiddenCoinsExternal } = this.props.wallet;
        const hiddenCoinsExternal: string[] = [];
        const numberOfVisibleNetworks = externalCoins
            .filter(item => !item.isHidden)
            .filter(item => !hiddenCoinsExternal.includes(item.id));

        return numberOfVisibleNetworks.length <= 0;
    }

    isMenuEmpty() {
        return this.isTopMenuEmpty() && this.isBottomMenuEmpty();
    }

    render() {
        // TODO
        // const { hiddenCoins } = this.props.wallet;
        const hiddenCoins: string[] = [];
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
                            onClick={() => goto(`/wallet/account#/${item.shortcut}/0`)}
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

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(CoinMenu);
