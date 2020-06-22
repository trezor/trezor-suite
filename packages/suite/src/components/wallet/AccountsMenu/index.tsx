import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { H2, variables, colors } from '@trezor/components';
import styled from 'styled-components';

import { DISCOVERY } from '@wallet-actions/constants';
import { useDiscovery } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { sortByCoin, getFailedAccounts } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';

import AccountGroup from './components/AccountGroup';
import AccountItem from './components/AccountItem/Container';
import AddAccountButton from './components/AddAccount';
import { useScrollRef } from '@suite-hooks/useScrollRef';

const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: auto;
    /* margin-top: 10px; */
    padding: 20px 8px;
`;

const MenuHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 16px;
    padding-bottom: 16px;
    margin-bottom: 8px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Heading = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
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
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AccountsMenu = ({ device, accounts, selectedAccount, openModal }: Props) => {
    const { discovery } = useDiscovery();
    const { params } = selectedAccount;
    const { ref, dimensions, updateDimensions } = useScrollRef();
    const selectedItemRef = useCallback((_item: HTMLDivElement | null) => {
        // TODO: scroll to selected item
    }, []);

    // update Scroll dimensions whenever discovery changes (adding account)
    // or whenever AccountGroup updates its animation
    useEffect(() => {
        updateDimensions();
    }, [discovery, updateDimensions]);

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
    const failed = getFailedAccounts(discovery);

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

    const buildGroup = (type: Account['accountType'], accounts: Account[]) => {
        const groupHasBalance = accounts.find(a => a.availableBalance !== '0');
        return (
            <AccountGroup
                key={type}
                type={type}
                hasBalance={!!groupHasBalance}
                keepOpened={isOpened(type)}
                onUpdate={updateDimensions}
            >
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
    };

    return (
        <Wrapper>
            <Scroll ref={ref}>
                <MenuHeader>
                    <Heading noMargin>My Accounts</Heading>
                    <AddAccountButton
                        onClick={() =>
                            openModal({
                                type: 'add-account',
                                device,
                            })
                        }
                        disabled={!!addAccountDisabled}
                        device={device}
                    />
                </MenuHeader>
                {buildGroup('normal', normalAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
            </Scroll>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountsMenu);
