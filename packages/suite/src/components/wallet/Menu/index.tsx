import React, { useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { DISCOVERY } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account, WalletParams } from '@wallet-types';

import AccountGroup from './components/AccountGroup';
import AccountItem from './components/AccountItem/Container';
import AddAccountButton from './components/AddAccount';

const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: auto;
    margin-top: 10px;
`;

const Scroll = styled.div`
    height: auto;
    overflow-y: auto;
    overflow-x: hidden;

    /* TODO: this make nice scrollbar on webkit-like browsers however it prevents hiding the scrollbar on macs (should hide when there is no mouse connected) */
    /* Maybe we should just use something like https://github.com/Grsmto/simplebar */
    ::-webkit-scrollbar {
        background-color: #fff;
        width: 10px;
    }

    /* background of the scrollbar except button or resizer */
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }

    /* scrollbar itself */
    ::-webkit-scrollbar-thumb {
        /* 7F7F7F for mac-like color */
        background-color: #babac0;
        border-radius: 10px;
        border: 2px solid #fff;
    }
    /* set button(top and bottom of the scrollbar) */
    ::-webkit-scrollbar-button {
        display: none;
    }
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    selectedAccount: state.wallet.selectedAccount,
    discovery: state.wallet.discovery,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const getAccountParams = (router: Props['router'], account?: Account): WalletParams | void => {
    if (router.app === 'wallet' && router.params) {
        return router.params;
    }
    if (account) {
        return {
            accountIndex: account.index,
            accountType: account.accountType,
            symbol: account.symbol,
        };
    }
};

const Menu = ({
    device,
    accounts,
    selectedAccount,
    getDiscoveryForDevice,
    router,
    openModal,
}: Props) => {
    const params = getAccountParams(router, selectedAccount.account);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedItemRef = useCallback((_item: HTMLDivElement | null) => {
        // TODO: scroll to selected item
    }, []);

    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return (
            <Wrapper>
                <div />
                <AddAccountButton disabled />
            </Wrapper>
        );
    }

    const isOpened = (group: Account['accountType']) =>
        params ? params.accountType === group : false;

    const isSelected = (account: Account) =>
        params &&
        account.symbol === params.symbol &&
        account.accountType === params.accountType &&
        account.index === params.accountIndex;

    const discoveryIsRunning = discovery.status <= DISCOVERY.STATUS.STOPPING;
    const failed: any[] = discovery.failed.map(f => ({
        ...f,
        path: 'path',
        descriptor: f.index + f.symbol + f.accountType,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
    }));

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));
    // always show first "normal" account even if they are empty
    const normalAccounts = list.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const segwitAccounts = list.filter(a => a.accountType === 'segwit' && (!a.empty || a.visible));
    const legacyAccounts = list.filter(a => a.accountType === 'legacy' && (!a.empty || a.visible));

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled =
        discoveryIsRunning || !device.connected || device.authConfirm || device.authFailed;

    // const legacyHasBalance = legacyAccounts.find(a => a.availableBalance !== '0');
    // let legacyVisible = legacyAccounts.length < 5 || discoveryIsRunning || !!legacyHasBalance;
    // if (!legacyVisible) {
    //     const legacyAccountIsSelected = legacyAccounts.find(a => isSelected(a));
    //     legacyVisible = !!legacyAccountIsSelected;
    // }

    const buildGroup = (type: Account['accountType'], accounts: Account[]) => (
        <AccountGroup key={type} type={type} opened={isOpened(type)}>
            {accounts.map(account => {
                const selected = !!isSelected(account);
                const forwardedRef = selected ? selectedItemRef : undefined;
                return (
                    <AccountItem
                        key={`${account.descriptor}-${account.symbol}`}
                        account={account}
                        selected={selected}
                        forwardedRef={forwardedRef}
                    />
                );
            })}
        </AccountGroup>
    );

    return (
        <Wrapper>
            <Scroll ref={wrapperRef}>
                {buildGroup('normal', normalAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
            </Scroll>
            <AddAccountButton
                onClick={() =>
                    openModal({
                        type: 'add-account',
                        device,
                    })
                }
                disabled={!!addAccountDisabled}
            />
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
