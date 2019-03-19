/* @flow */
import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { toFiatCurrency } from 'utils/fiatConverter';
import * as stateUtils from 'reducers/utils';
import { findDeviceAccounts } from 'reducers/AccountsReducer';

import { Icon, Loader, Tooltip, icons as ICONS, colors } from 'trezor-ui-components';
import { FONT_SIZE, BORDER_WIDTH, LEFT_NAVIGATION_ROW } from 'config/variables';

import type { Accounts } from 'flowtype';
import l10nCommonMessages from 'views/common.messages';
import type { Props } from '../common';
import Row from '../Row';
import RowCoin from '../RowCoin';
import l10nMessages from './index.messages';

const Wrapper = styled.div``;

const Text = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const RowAccountWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
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

const RowAddAccountWrapper = styled.div`
    width: 100%;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    display: flex;
    align-items: center;
    color: ${colors.TEXT_SECONDARY};
    &:hover {
        cursor: ${props => (props.disabled ? 'default' : 'pointer')};
        color: ${props => (props.disabled ? colors.TEXT_SECONDARY : colors.TEXT_PRIMARY)};
    }
`;

const AddAccountIconWrapper = styled.div`
    margin-right: 12px;
`;

const DiscoveryLoadingWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${FONT_SIZE.BASE};
    white-space: nowrap;
    color: ${colors.TEXT_SECONDARY};
`;

const DiscoveryLoadingText = styled.span`
    margin-left: 14px;
`;

// TODO: Refactorize deviceStatus & selectedAccounts
const AccountMenu = (props: Props) => {
    const selected = props.wallet.selectedDevice;
    const { location } = props.router;
    const urlParams = location.state;
    const { accounts } = props;
    const baseUrl: string = urlParams.deviceInstance
        ? `/device/${urlParams.device}:${urlParams.deviceInstance}`
        : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const network = config.networks.find(c => c.shortcut === location.state.network);

    if (!selected || !network) return null;

    const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);

    const selectedAccounts = deviceAccounts.map((account, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
        const url: string = location.pathname.replace(/account+\/([0-9]*)/, `account/${i}`);

        let balance: ?string = null;
        const fiatRates = props.fiat.find(f => f.network === network.shortcut);
        const { localCurrency } = props.wallet;
        let fiat = '';
        if (account.balance !== '') {
            const pending = stateUtils.getAccountPendingTx(props.pending, account);
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
            const availableBalance: string = new BigNumber(account.balance)
                .minus(pendingAmount)
                .toString(10);

            balance = `${availableBalance} ${network.symbol}`;
            if (fiatRates) {
                fiat = toFiatCurrency(availableBalance, localCurrency, fiatRates);
                balance = `${availableBalance} ${network.symbol} / `;
            }
        }

        const urlAccountIndex = parseInt(props.router.location.state.account, 10);
        return (
            <NavLink to={url} key={account.index}>
                <Row column>
                    <RowAccountWrapper
                        isSelected={urlAccountIndex === account.index}
                        borderTop={account.index === 0}
                    >
                        <FormattedMessage
                            {...l10nCommonMessages.TR_ACCOUNT_HASH}
                            values={{ number: account.index + 1 }}
                        />
                        {balance && (
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
                                <FormattedMessage {...l10nMessages.TR_LOADING_DOT_DOT_DOT} />
                            </Text>
                        )}
                    </RowAccountWrapper>
                </Row>
            </NavLink>
        );
    });

    let discoveryStatus = null;
    const discovery = props.discovery.find(
        d => d.deviceState === selected.state && d.network === location.state.network
    );

    if (discovery && discovery.completed) {
        const lastAccount = deviceAccounts[deviceAccounts.length - 1];
        if (!selected.connected) {
            discoveryStatus = (
                <Tooltip
                    maxWidth={200}
                    content={<FormattedMessage {...l10nMessages.TR_TO_ADD_ACCOUNTS} />}
                    placement="bottom"
                >
                    <Row>
                        <RowAddAccountWrapper disabled>
                            <AddAccountIconWrapper>
                                <Icon icon={ICONS.PLUS} size={14} color={colors.TEXT_SECONDARY} />
                            </AddAccountIconWrapper>
                            <FormattedMessage {...l10nMessages.TR_ADD_ACCOUNT} />
                        </RowAddAccountWrapper>
                    </Row>
                </Tooltip>
            );
        } else if (lastAccount && !lastAccount.empty) {
            discoveryStatus = (
                <Row onClick={props.addAccount}>
                    <RowAddAccountWrapper>
                        <AddAccountIconWrapper>
                            <Icon icon={ICONS.PLUS} size={14} color={colors.TEXT_SECONDARY} />
                        </AddAccountIconWrapper>
                        <FormattedMessage {...l10nMessages.TR_ADD_ACCOUNT} />
                    </RowAddAccountWrapper>
                </Row>
            );
        } else {
            discoveryStatus = (
                <Tooltip
                    maxWidth={200}
                    content={<FormattedMessage {...l10nMessages.TR_TO_ADD_A_NEW_ACCOUNT_LAST} />}
                    placement="bottom"
                >
                    <Row>
                        <RowAddAccountWrapper disabled>
                            <AddAccountIconWrapper>
                                <Icon icon={ICONS.PLUS} size={14} color={colors.TEXT_SECONDARY} />
                            </AddAccountIconWrapper>
                            <FormattedMessage {...l10nMessages.TR_ADD_ACCOUNT} />
                        </RowAddAccountWrapper>
                    </Row>
                </Tooltip>
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
            <NavLink to={baseUrl}>
                <RowCoin
                    network={{
                        name: network.name,
                        shortcut: network.shortcut,
                    }}
                    iconLeft={{
                        type: ICONS.ARROW_LEFT,
                        color: colors.TEXT_PRIMARY,
                        size: 10,
                    }}
                />
            </NavLink>
            <Wrapper>{selectedAccounts}</Wrapper>
            {discoveryStatus}
        </Wrapper>
    );
};

export default AccountMenu;
