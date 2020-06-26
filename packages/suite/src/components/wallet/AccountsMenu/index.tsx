import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { H2, variables, colors, Icon } from '@trezor/components';
import { Translation, Backdrop } from '@suite-components';

import { DISCOVERY } from '@wallet-actions/constants';
import { useDiscovery, useLayoutSize } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { sortByCoin, getFailedAccounts } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';

import AccountGroup from './components/AccountGroup';
import AccountItem from './components/AccountItem/Container';
import AddAccountButton from './components/AddAccount';

const Wrapper = styled.div<{ isMobileLayout?: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 4; /*  higher than accounts list to prevent box-shadow overflow */
    /* margin-top: 10px; */

    ${props =>
        !props.isMobileLayout &&
        css`
            flex: 1;
            padding: 0px 8px;
            overflow: auto;
        `}
`;

const MenuHeader = styled.div<{ isMobileLayout?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${colors.NEUE_BG_WHITE};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};

    ${props =>
        props.isMobileLayout &&
        css`
            padding: 12px 16px;
        `}

    ${props =>
        !props.isMobileLayout &&
        css`
            padding: 20px 8px 16px 8px;
            margin-bottom: 8px;
        `}
`;

const Search = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 8px 0px;
    background: ${colors.NEUE_BG_WHITE};
    /* border-bottom: 1px solid ${colors.NEUE_STROKE_GREY}; */
`;

const Heading = styled(H2)<{ isMobileLayout?: boolean }>`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    ${props =>
        props.isMobileLayout &&
        css`
            font-size: 18px;
        `}
`;

const ExpandIcon = styled(Icon)`
    cursor: pointer;
`;

const MenuItemsWrapper = styled.div`
    position: relative;
    height: 100vh;
`;

const ExpandedMobileWrapper = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${colors.NEUE_BG_WHITE};
    z-index: 3;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.2);
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 0px 16px;
    padding-bottom: 16px;
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
    const { isMobileLayout } = useLayoutSize();
    const [isExpanded, setIsExpanded] = useState(false);
    const [animatedIcon, setAnimatedIcon] = useState(false);

    const selectedItemRef = useCallback((_item: HTMLDivElement | null) => {
        // TODO: scroll to selected item
    }, []);

    if (!device || !discovery) {
        // TODO: default empty state while retrieving data from the device
        return (
            <Wrapper isMobileLayout={isMobileLayout}>
                <MenuHeader isMobileLayout={isMobileLayout}>
                    <Heading noMargin isMobileLayout={isMobileLayout}>
                        <Translation id="TR_MY_ACCOUNTS" />
                    </Heading>
                </MenuHeader>
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
                            closeMenu={() => setIsExpanded(false)}
                        />
                    );
                })}
            </AccountGroup>
        );
    };

    if (isMobileLayout) {
        return (
            <>
                <Wrapper isMobileLayout={isMobileLayout}>
                    <MenuHeader
                        isMobileLayout={isMobileLayout}
                        onClick={() => {
                            if (isMobileLayout) {
                                setIsExpanded(!isExpanded);
                                setAnimatedIcon(true);
                            }
                        }}
                    >
                        <Heading noMargin isMobileLayout={isMobileLayout}>
                            <Translation id="TR_MY_ACCOUNTS" />
                        </Heading>
                        <ExpandIcon
                            canAnimate={animatedIcon}
                            isActive={isExpanded}
                            size={20}
                            color={colors.BLACK50}
                            onClick={() => {
                                setIsExpanded(!isExpanded);
                                setAnimatedIcon(true);
                            }}
                            icon="ARROW_DOWN"
                        />
                    </MenuHeader>
                </Wrapper>
                {isExpanded && (
                    <MenuItemsWrapper>
                        <ExpandedMobileWrapper>
                            <Search>
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
                            </Search>
                            {buildGroup('normal', normalAccounts)}
                            {buildGroup('segwit', segwitAccounts)}
                            {buildGroup('legacy', legacyAccounts)}
                        </ExpandedMobileWrapper>
                        {/* <Backdrop
                            show={isExpanded}
                            animated
                            onClick={() => {
                                setIsExpanded(!isExpanded);
                                setAnimatedIcon(true);
                            }}
                        /> */}
                    </MenuItemsWrapper>
                )}
            </>
        );
    }

    return (
        <Wrapper>
            <Scroll>
                <MenuHeader>
                    <Heading noMargin>
                        <Translation id="TR_MY_ACCOUNTS" />
                    </Heading>

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
