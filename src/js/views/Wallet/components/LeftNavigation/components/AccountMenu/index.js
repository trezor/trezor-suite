/* @flow */
import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import Icon from 'components/Icon';
import colors from 'config/colors';
import Loader from 'components/LoaderCircle';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import * as stateUtils from 'reducers/utils';
import Tooltip from 'rc-tooltip';
import ICONS from 'config/icons';

import { NavLink } from 'react-router-dom';
import { findDeviceAccounts } from 'reducers/AccountsReducer';
import {
    FONT_SIZE, BORDER_WIDTH, TRANSITION_TIME,
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

const RowAccountWrapper = styled.div`
    height: 64px;
    padding: 16px 0 16px 24px;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_PRIMARY};
    border-top: 1px solid ${colors.DIVIDER};
    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
    ${props => props.isSelected && css`
        border-left: ${BORDER_WIDTH.SELECTED} solid ${colors.GREEN_PRIMARY};
        background: ${colors.WHITE};

        &:hover {
            background-color: ${colors.WHITE};
        }

        &:last-child {
            border-bottom: 1px solid ${colors.DIVIDER};
        }
    `}
`;

const RowAccount = ({
    accountIndex, balance, isSelected = false,
}) => (
    <RowAccountWrapper
        isSelected={isSelected}
    >
        <Row column>
            Account #{accountIndex + 1}
            {balance ? (
                <Text>{balance}</Text>
            ) : (
                <Text>Loading...</Text>
            )}
        </Row>
    </RowAccountWrapper>
);

RowAccount.propTypes = {
    accountIndex: PropTypes.number.isRequired,
    balance: PropTypes.string,
    isSelected: PropTypes.bool,
};

const AddAccountWrapper = styled.div`
    position: relative;
    padding: 8px 0 8px 20px;
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};
    display: flex;
    align-items: center;

    &:hover {
        color: ${colors.TEXT_PRIMARY};
        transition: background-color ${TRANSITION_TIME.BASE} ease-in-out, color ${TRANSITION_TIME.BASE} ease-in-out, border-color ${TRANSITION_TIME.BASE} ease-in-out;
    }

    ${props => props.disabled && css`
        cursor: not-allowed;
        &:hover {
            color: ${colors.TEXT_SECONDARY};
        }
    `}
`;

const AddAccountIconWrapper = styled.div`
    margin-right: 12px;
`;

const DiscoveryStatusWrapper = styled.div`
    height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    font-size: ${FONT_SIZE.SMALL};
    padding: 16px 28px 16px 30px;
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
    flex-direction: row;
    align-items: center;
    font-size: ${FONT_SIZE.SMALL};
    padding: 8px 0 8px 22px;
    white-space: nowrap;
    color: ${colors.TEXT_SECONDARY};
`;

const DiscoveryLoadingText = styled.span`
    margin-left: 14px;
`;

// class AccountMenu extends Component {
//     constructor(props: Props) {
//         super(props);
//         this.state = {
//             selectedAccounts: null,
//             selectedCoin: null,
//         };
//     }

//     componentWillReceiveProps(nextProps) {

//     }

//     render() {
//         return (
//             <div>
//                 Hello
//             </div>
//         );
//     }
// }

const AccountMenu = (props: Props): ?React$Element<string> => {
    const selected = props.wallet.selectedDevice;
    const { location } = props.router;
    const urlParams = location.state;
    const { accounts } = props;
    const baseUrl: string = urlParams.deviceInstance ? `/device/${urlParams.device}:${urlParams.deviceInstance}` : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === location.state.network);
    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);

    let selectedAccounts = deviceAccounts.map((account, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
        const url: string = location.pathname.replace(/account+\/([0-9]*)/, `account/${i}`);

        let balance: string = 'Loading...';
        if (account.balance !== '') {
            const pending = stateUtils.getAccountPendingTx(props.pending, account);
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, selectedCoin.symbol);
            const availableBalance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

            if (fiatRate) {
                const accountBalance = new BigNumber(availableBalance);
                const fiat = accountBalance.times(fiatRate.value).toFixed(2);
                balance = `${availableBalance} ${selectedCoin.symbol} / $${fiat}`;
            } else {
                balance = `${availableBalance} ${selectedCoin.symbol}`;
            }
        }

        const urlAccountIndex = parseInt(props.router.location.state.account, 10);
        return (
            <NavLink
                to={url}
                key={account.index}
            >
                <RowAccount
                    accountIndex={account.index}
                    url={url}
                    balance={balance}
                    isSelected={urlAccountIndex === account.index}
                />
            </NavLink>
        );
    });

    if (selectedAccounts.length < 1) {
        if (selected.connected) {
            const url: string = location.pathname.replace(/account+\/([0-9]*)/, 'account/0');
            selectedAccounts = (
                <NavLink
                    to={url}
                >
                    <RowAccount
                        accountIndex={0}
                        url={url}
                        isSelected
                    />
                </NavLink>
            );
        }
    }

    let discoveryStatus = null;
    const discovery = props.discovery.find(d => d.deviceState === selected.state && d.network === location.state.network);

    if (discovery) {
        if (discovery.completed) {
            // TODO: add only if last one is not empty
            //if (selectedAccounts.length > 0 && selectedAccounts[selectedAccounts.length - 1])
            const lastAccount = deviceAccounts[deviceAccounts.length - 1];
            if (lastAccount && (new BigNumber(lastAccount.balance).greaterThan(0) || lastAccount.nonce > 0)) {
                discoveryStatus = (
                    <AddAccountWrapper
                        onClick={props.addAccount}
                    >
                        <AddAccountIconWrapper>
                            <Icon
                                icon={ICONS.PLUS}
                                size={24}
                                color={colors.TEXT_SECONDARY}
                            />
                        </AddAccountIconWrapper>
                        Add account
                    </AddAccountWrapper>
                );
            } else {
                const tooltip = (
                    <div className="aside-tooltip-wrapper">
                        To add a new account, last account must have some transactions.
                    </div>
                );
                discoveryStatus = (
                    <Tooltip
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}
                        overlay={tooltip}
                        placement="top"
                    >
                        <AddAccountWrapper
                            onClick={props.addAccount}
                            disabled
                        >
                            <AddAccountIconWrapper>
                                <Icon
                                    icon={ICONS.PLUS}
                                    size={24}
                                    color={colors.TEXT_SECONDARY}
                                />
                            </AddAccountIconWrapper>
                            Add account
                        </AddAccountWrapper>
                    </Tooltip>
                );
            }
        } else if (!selected.connected || !selected.available) {
            discoveryStatus = (
                <DiscoveryStatusWrapper>
                    Accounts could not be loaded
                    <DiscoveryStatusText>
                        {`Connect ${selected.instanceLabel} device`}
                    </DiscoveryStatusText>
                </DiscoveryStatusWrapper>
            );
        } else {
            discoveryStatus = (
                <DiscoveryLoadingWrapper>
                    <Loader size="20" />
                    <DiscoveryLoadingText>
                        Loading accounts...
                    </DiscoveryLoadingText>
                </DiscoveryLoadingWrapper>
            );
        }
    }

    let backButton = null;
    if (selectedCoin) {
        let imgName = selectedCoin.network;
        if (selectedCoin.network === 'ethereum') {
            imgName = 'eth';
        } else if (selectedCoin.network === 'ethereum-classic') {
            imgName = 'etc';
        }
        const imgUrl = `../images/${imgName}-logo.png`;
        backButton = (
            <NavLink to={baseUrl}>
                <RowCoin
                    coin={{
                        img: imgUrl,
                        name: selectedCoin.name,
                    }}
                    iconLeft={{
                        type: ICONS.ARROW_LEFT,
                        color: colors.TEXT_PRIMARY,
                        size: 20,
                    }}
                />
            </NavLink>
        );
    }

    return (
        <Wrapper>
            {backButton}
            <div>
                {selectedAccounts}
            </div>
            {discoveryStatus}
        </Wrapper>
    );
};

export default AccountMenu;
