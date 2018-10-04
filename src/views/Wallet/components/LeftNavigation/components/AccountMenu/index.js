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
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
`;

const TooltipContent = styled.div`
    font-size: ${FONT_SIZE.SMALLEST};
`;

const RowAccountWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${FONT_SIZE.SMALL};
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

const DiscoveryStatusWrapper = styled.div`
    display: flex;
    flex-direction: column;

    font-size: ${FONT_SIZE.SMALL};
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    white-space: nowrap;
    border-top: 1px solid ${colors.DIVIDER};
`;

const DiscoveryStatusText = styled.div`
    display: block;
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const DiscoveryLoadingWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${FONT_SIZE.SMALL};
    white-space: nowrap;
    color: ${colors.TEXT_SECONDARY};
`;

const DiscoveryLoadingText = styled.span`
    margin-left: 14px;
`;

// TODO: Refactorize deviceStatus & selectedAccounts
const AccountMenu = (props: Props): ?React$Element<string> => {
    const selected = props.wallet.selectedDevice;
    const { location } = props.router;
    const urlParams = location.state;
    const { accounts } = props;
    const baseUrl: string = urlParams.deviceInstance ? `/device/${urlParams.device}:${urlParams.deviceInstance}` : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === location.state.network);

    if (!selected || !selectedCoin) return;

    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);

    const selectedAccounts = deviceAccounts.map((account, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
        const url: string = location.pathname.replace(/account+\/([0-9]*)/, `account/${i}`);

        let balance: string = 'Loading...';
        if (account.balance !== '') {
            const pending = stateUtils.getAccountPendingTx(props.pending, account);
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, selectedCoin.symbol);
            const availableBalance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

            balance = `${availableBalance} ${selectedCoin.symbol}`;
            if (fiatRate) {
                const accountBalance = new BigNumber(availableBalance);
                const fiat = accountBalance.times(fiatRate.value).toFixed(2);
                balance = `${availableBalance} ${selectedCoin.symbol} / $${fiat}`;
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

    if (discovery) {
        if (discovery.completed) {
            // TODO: add only if last one is not empty
            //if (selectedAccounts.length > 0 && selectedAccounts[selectedAccounts.length - 1])
            const lastAccount = deviceAccounts[deviceAccounts.length - 1];
            if (lastAccount && (new BigNumber(lastAccount.balance).greaterThan(0) || lastAccount.nonce > 0)) {
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
                        content={<TooltipContent>To add a new account, last account must have some transactions.</TooltipContent>}
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
        } else if (!selected.connected || !selected.available) {
            discoveryStatus = (
                <Row>
                    <DiscoveryStatusWrapper>
                        Accounts could not be loaded
                        <DiscoveryStatusText>
                            {`Connect ${selected.instanceLabel} device`}
                        </DiscoveryStatusText>
                    </DiscoveryStatusWrapper>
                </Row>
            );
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
    }

    return (
        <Wrapper>
            {selectedCoin && (
                <NavLink to={baseUrl}>
                    <RowCoin
                        coin={{
                            name: selectedCoin.name,
                            network: selectedCoin.network,
                        }}
                        iconLeft={{
                            type: ICONS.ARROW_LEFT,
                            color: colors.TEXT_PRIMARY,
                            size: 20,
                        }}
                    />
                </NavLink>
            )}
            <Wrapper>
                {selectedAccounts}
            </Wrapper>
            {discoveryStatus}
        </Wrapper>
    );
};

export default AccountMenu;
