import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import * as reducerUtils from '@wallet-utils/reducerUtils';
// import * as stateUtils from 'reducers/utils';

import { Loader, colors, variables } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import SETTINGS from '@suite-config/settings';
import Row from '@wallet-components/Row';
import RowCoin from '@wallet-components/RowCoin';
import { AppState } from '@suite/types/suite';
import { connect } from 'react-redux';
import { Link } from '@suite/components/suite';
import networks from '@suite/config/suite/networks';
import { Transaction } from '@suite/types/wallet';
import { Account, findDeviceAccounts } from '@wallet-reducers/accountsReducer';
import { getRoute } from '@suite/utils/suite/router';
import { STATUS } from '@suite/reducers/wallet/discoveryReducer';
import AddAccountButton from './components/AddAccountButton';
import l10nMessages from './index.messages';

const { FONT_SIZE, BORDER_WIDTH, LEFT_NAVIGATION_ROW } = variables;

// TODO: add badge to components or figure out where new font sizes should be defined
const FONT_SIZE_BADGE = '0.7857rem';

const Wrapper = styled.div``;

const Text = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const RowAccountWrapper = styled.div<{ borderTop: boolean; isSelected: boolean }>`
    width: 100%;
    display: flex;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    border-left: ${BORDER_WIDTH.SELECTED} solid transparent;
    border-bottom: 1px solid ${colors.DIVIDER};

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }

    ${props =>
        props.borderTop &&
        css`
            border-top: 1px solid ${colors.DIVIDER};
        `}

    ${props =>
        props.isSelected &&
        css`
            border-left: ${BORDER_WIDTH.SELECTED} solid ${colors.GREEN_PRIMARY};
            background: ${colors.WHITE};
            &:hover {
                background-color: ${colors.WHITE};
            }
        `}
`;

const DiscoveryLoadingWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${FONT_SIZE_BADGE};
    white-space: nowrap;
    color: ${colors.TEXT_SECONDARY};
`;

const DiscoveryLoadingText = styled.span`
    margin-left: 14px;
`;

const Col = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const RightCol = styled(Col)`
    justify-content: center;
`;

const Badge = styled.div`
    padding: 4px 8px;
    background: lightslategray;
    color: white;
    font-size: ${FONT_SIZE_BADGE};
    border-radius: 3px;
    align-self: flex-end;
`;

const LinkNoUnderline = styled(Link)`
    &:visited,
    &:active,
    &:hover {
        text-decoration: none;
    }
`;

interface Props {
    suite: AppState['suite'];
    wallet: AppState['wallet'];
    router: AppState['router'];
    discovery: AppState['wallet']['discovery'];
    addAccount: () => any; // TODO
}

// TODO: Refactorize deviceStatus & selectedAccounts
const AccountMenu = (props: Props) => {
    const selected = props.suite.device;
    const { params } = props.router;
    const network = networks.find(c => c.shortcut === params.coin);

    if (!selected || !network) return null;

    // TODO
    const { accounts } = props.wallet;
    const deviceAccounts = findDeviceAccounts(accounts, network.shortcut);
    const discoveryAccounts: Account[] = deviceAccounts.filter(
        account => account.imported === false,
    );

    const selectedAccounts = deviceAccounts.map((account, i) => {
        const url = getRoute('wallet-account', {
            coin: network.shortcut,
            accountId: `${account.index}`,
        });
        const { availableBalance } = account;
        const fiatRates = props.wallet.fiat.find(f => f.network === network.shortcut);
        const { localCurrency } = props.wallet.settings;

        let fiat = '';
        let balance = '';
        balance = `${availableBalance} ${network.symbol}`;
        if (fiatRates) {
            fiat = toFiatCurrency(availableBalance, localCurrency, fiatRates);
            balance = `${availableBalance} ${network.symbol} / `;
        }

        return (
            <LinkNoUnderline href={url} key={url}>
                <Row>
                    <RowAccountWrapper
                        isSelected={parseInt(params.accountId, 10) === account.index}
                        borderTop={i === 0}
                    >
                        <Col>
                            <FormattedMessage
                                {...(account.imported
                                    ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                                    : l10nCommonMessages.TR_ACCOUNT_HASH)}
                                values={{ number: account.index + 1 }}
                            />
                            {balance && !props.wallet.settings.hideBalance && (
                                <Text>
                                    {balance}
                                    {fiatRates && (
                                        <FormattedNumber
                                            currency={localCurrency}
                                            value={fiat}
                                            minimumFractionDigits={2}
                                            // eslint-disable-next-line react/style-prop-object
                                            style="currency"
                                        />
                                    )}
                                </Text>
                            )}
                            {!balance && (
                                <Text>
                                    <FormattedMessage
                                        {...l10nCommonMessages.TR_LOADING_DOT_DOT_DOT}
                                    />
                                </Text>
                            )}
                        </Col>
                        {account.imported && (
                            <RightCol>
                                <Badge>watch-only</Badge>
                            </RightCol>
                        )}
                    </RowAccountWrapper>
                </Row>
            </LinkNoUnderline>
        );
    });

    let discoveryStatus = null;
    const discovery = props.discovery.find(
        // TODO: compare deviceState not just device id
        // d => d.device === selected.state && d.network === network.shortcut,
        d => d.device === selected.features.device_id,
    );

    if (discovery && discovery.status === STATUS.COMPLETED) {
        const lastAccount = discoveryAccounts[discoveryAccounts.length - 1];
        if (!selected.connected) {
            discoveryStatus = (
                <AddAccountButton
                    disabled
                    tooltipContent={<FormattedMessage {...l10nMessages.TR_TO_ADD_ACCOUNTS} />}
                />
            );
        } else if (discoveryAccounts.length >= SETTINGS.MAX_ACCOUNTS) {
            discoveryStatus = (
                <AddAccountButton
                    disabled
                    tooltipContent={
                        <FormattedMessage
                            {...l10nMessages.TR_YOU_CANNOT_ADD_MORE_THAN_10_ACCOUNTS}
                        />
                    }
                />
            );
        } else if (lastAccount && !lastAccount.empty) {
            discoveryStatus = <AddAccountButton onClick={props.addAccount} />;
        } else {
            discoveryStatus = (
                <AddAccountButton
                    disabled
                    tooltipContent={
                        <FormattedMessage {...l10nMessages.TR_TO_ADD_A_NEW_ACCOUNT_LAST} />
                    }
                />
            );
        }
    } else {
        discoveryStatus = (
            <Row>
                <DiscoveryLoadingWrapper>
                    <Loader size={20} />
                    <DiscoveryLoadingText>
                        <FormattedMessage {...l10nCommonMessages.TR_LOADING_DOT_DOT_DOT} />
                    </DiscoveryLoadingText>
                </DiscoveryLoadingWrapper>
            </Row>
        );
    }

    if (discovery && (discovery.fwNotSupported || discovery.fwOutdated)) {
        discoveryStatus = null;
    }

    return (
        <Wrapper>
            <LinkNoUnderline href={getRoute('wallet-index')}>
                <RowCoin
                    network={network}
                    iconLeft={{
                        type: 'ARROW_LEFT',
                        color: colors.TEXT_PRIMARY,
                        size: 10,
                    }}
                />
            </LinkNoUnderline>
            <Wrapper>{selectedAccounts}</Wrapper>
            {discoveryStatus}
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    router: state.router,
    discovery: state.wallet.discovery,
    addAccount: () => {},
});

export default connect(mapStateToProps)(AccountMenu);
