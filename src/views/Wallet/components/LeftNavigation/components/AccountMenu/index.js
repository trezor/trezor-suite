/* @flow */
import React from 'react';
import BigNumber from 'bignumber.js';
import Icon from 'components/Icon';
import colors from 'config/colors';
import Loader from 'components/Loader';
import styled, { css } from 'styled-components';
import * as stateUtils from 'reducers/utils';
import Tooltip from 'components/Tooltip';
import ICONS from 'config/icons';

import { NavLink } from 'react-router-dom';
import { findDeviceAccounts } from 'reducers/AccountsReducer';
import {
    FONT_SIZE, BORDER_WIDTH, LEFT_NAVIGATION_ROW,
} from 'config/variables';

import type { Accounts } from 'flowtype';
import type { Props } from '../common';
import Row from '../Row';
import RowCoin from '../RowCoin';

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

    ${props => props.borderTop && css`
        border-top: 1px solid ${colors.DIVIDER};
    `}

    ${props => props.isSelected && css`
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
    const baseUrl: string = urlParams.deviceInstance ? `/device/${urlParams.device}:${urlParams.deviceInstance}` : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const network = config.networks.find(c => c.shortcut === location.state.network);

    if (!selected || !network) return null;

    const fiatRate = props.fiat.find(f => f.network === network.shortcut);

    const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);

    const selectedAccounts = deviceAccounts.map((account, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
        const url: string = location.pathname.replace(/account+\/([0-9]*)/, `account/${i}`);

        let balance: string = 'Loading...';
        if (account.balance !== '') {
            const pending = stateUtils.getAccountPendingTx(props.pending, account);
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
            const availableBalance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

            balance = `${availableBalance} ${network.symbol}`;
            if (fiatRate) {
                const accountBalance = new BigNumber(availableBalance);
                const fiat = accountBalance.times(fiatRate.value).toFixed(2);
                balance = `${availableBalance} ${network.symbol} / $${fiat}`;
            }
        }

        const urlAccountIndex = parseInt(props.router.location.state.account, 10);
        return (
            <NavLink
                to={url}
                key={account.index}
            >
                <Row column>
                    <RowAccountWrapper
                        isSelected={urlAccountIndex === account.index}
                        borderTop={account.index === 0}
                    >
                        Account #{account.index + 1}
                        {balance && <Text>{balance}</Text>}
                        {!balance && <Text>Loading...</Text>}
                    </RowAccountWrapper>
                </Row>
            </NavLink>
        );
    });

    let discoveryStatus = null;
    const discovery = props.discovery.find(d => d.deviceState === selected.state && d.network === location.state.network);

    if (discovery && discovery.completed) {
        const lastAccount = deviceAccounts[deviceAccounts.length - 1];
        if (!selected.connected) {
            discoveryStatus = (
                <Tooltip
                    maxWidth={200}
                    content={`To add a new account, connect ${selected.instanceLabel} device.`}
                    placement="bottom"
                >
                    <Row>
                        <RowAddAccountWrapper disabled>
                            <AddAccountIconWrapper>
                                <Icon
                                    icon={ICONS.PLUS}
                                    size={24}
                                    color={colors.TEXT_SECONDARY}
                                />
                            </AddAccountIconWrapper>
                            Add account
                        </RowAddAccountWrapper>
                    </Row>
                </Tooltip>
            );
        } else if (lastAccount && !lastAccount.empty) {
            discoveryStatus = (
                <Row onClick={props.addAccount}>
                    <RowAddAccountWrapper>
                        <AddAccountIconWrapper>
                            <Icon
                                icon={ICONS.PLUS}
                                size={24}
                                color={colors.TEXT_SECONDARY}
                            />
                        </AddAccountIconWrapper>
                        Add account
                    </RowAddAccountWrapper>
                </Row>
            );
        } else {
            discoveryStatus = (
                <Tooltip
                    maxWidth={200}
                    content="To add a new account, last account must have some transactions."
                    placement="bottom"
                >
                    <Row>
                        <RowAddAccountWrapper disabled>
                            <AddAccountIconWrapper>
                                <Icon
                                    icon={ICONS.PLUS}
                                    size={24}
                                    color={colors.TEXT_SECONDARY}
                                />
                            </AddAccountIconWrapper>
                            Add account
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
                        Loading...
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
                        size: 20,
                    }}
                />
            </NavLink>
            <Wrapper>
                {selectedAccounts}
            </Wrapper>
            {discoveryStatus}
        </Wrapper>
    );
};

export default AccountMenu;
