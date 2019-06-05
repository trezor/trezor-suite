import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { toFiatCurrency } from 'utils/fiatConverter';
import * as stateUtils from 'reducers/utils';
// import { findDeviceAccounts } from 'reducers/AccountsReducer';

import { Loader, icons, colors, variables } from '@trezor/components';

import l10nCommonMessages from '@suite/views/common.messages';
import { SETTINGS } from '@suite/config/app';
import Row from '../Row';
import RowCoin from '../RowCoin';
import l10nMessages from './index.messages';
import AddAccountButton from './components/AddAccountButton';

const Wrapper = styled.div``;

const Text = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const RowAccountWrapper = styled.div`
    width: 100%;
    display: flex;
    padding: ${variables.LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${variables.FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    border-left: ${variables.BORDER_WIDTH.SELECTED} solid transparent;
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
            border-left: ${variables.BORDER_WIDTH.SELECTED} solid ${colors.GREEN_PRIMARY};
            background: ${colors.WHITE};
            &:hover {
                background-color: ${colors.WHITE};
            }
        `}
`;

const DiscoveryLoadingWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: ${variables.LEFT_NAVIGATION_ROW.PADDING};
    font-size: ${variables.FONT_SIZE.BASE};
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
    font-size: ${variables.FONT_SIZE.BADGE};
    border-radius: 3px;
    align-self: flex-end;
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

    // const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);
    const discoveryAccounts: Accounts = deviceAccounts.filter(
        account => account.imported === false
    );

    // const selectedAccounts = deviceAccounts.map((account, i) => {
    //     // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
    //     let url: string;
    //     if (account.imported) {
    //         url = location.pathname.replace(/account+\/(i?[0-9]*)/, `account/i${account.index}`);
    //     } else {
    //         url = location.pathname.replace(/account+\/(i?[0-9]*)/, `account/${account.index}`);
    //     }

    //     let balance: string = null;
    //     const fiatRates = props.fiat.find(f => f.network === network.shortcut);
    //     const { localCurrency } = props.wallet;
    //     let fiat = '';
    //     if (account.balance !== '') {
    //         const pending = stateUtils.getAccountPendingTx(props.pending, account);
    //         const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
    //         const availableBalance: string = new BigNumber(account.balance)
    //             .minus(pendingAmount)
    //             .toString(10);

    //         balance = `${availableBalance} ${network.symbol}`;
    //         if (fiatRates) {
    //             fiat = toFiatCurrency(availableBalance, localCurrency, fiatRates);
    //             balance = `${availableBalance} ${network.symbol} / `;
    //         }
    //     }

    //     return (
    //         <NavLink to={url} key={url}>
    //             <Row column>
    //                 <RowAccountWrapper isSelected={location.pathname === url} borderTop={i === 0}>
    //                     <Col>
    //                         <FormattedMessage
    //                             {...(account.imported
    //                                 ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
    //                                 : l10nCommonMessages.TR_ACCOUNT_HASH)}
    //                             values={{ number: account.index + 1 }}
    //                         />
    //                         {balance && !props.wallet.hideBalance && (
    //                             <Text>
    //                                 {balance}
    //                                 {fiatRates && (
    //                                     <FormattedNumber
    //                                         currency={localCurrency}
    //                                         value={fiat}
    //                                         minimumFractionDigits={2}
    //                                         // eslint-disable-next-line react/style-prop-object
    //                                         style="currency"
    //                                     />
    //                                 )}
    //                             </Text>
    //                         )}
    //                         {!balance && (
    //                             <Text>
    //                                 <FormattedMessage {...l10nMessages.TR_LOADING_DOT_DOT_DOT} />
    //                             </Text>
    //                         )}
    //                     </Col>
    //                     {account.imported && (
    //                         <RightCol>
    //                             <Badge>watch-only</Badge>
    //                         </RightCol>
    //                     )}
    //                 </RowAccountWrapper>
    //             </Row>
    //         </NavLink>
    //     );
    // });

    let discoveryStatus = null;
    const discovery = props.discovery.find(
        d => d.deviceState === selected.state && d.network === location.state.network
    );

    if (discovery && discovery.completed) {
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
            {/* <Wrapper>{selectedAccounts}</Wrapper> */}
            {discoveryStatus}
        </Wrapper>
    );
};

export default AccountMenu;
