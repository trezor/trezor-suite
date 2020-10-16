import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import { H2, variables, colors, Icon } from '@trezor/components';
import { Translation, AddAccountButton } from '@suite-components';
import { useDiscovery, useLayoutSize, useAccountSearch } from '@suite-hooks';
import { sortByCoin, getFailedAccounts, accountSearchFn } from '@wallet-utils/accountUtils';
import { AppState } from '@suite-types';
import { Account } from '@wallet-types';

import AccountSearchBox from './components/AccountSearchBox';
import AccountGroup from './components/AccountGroup';
import AccountItem from './components/AccountItem/Container';

const Wrapper = styled.div<{ isMobileLayout?: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 4; /*  higher than accounts list to prevent box-shadow overflow */
    width: 100%;

    ${props =>
        !props.isMobileLayout &&
        css`
            padding: 0px 8px;
            overflow: auto;
        `}
`;

const MenuHeader = styled.div<{ isMobileLayout?: boolean }>`
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
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
            padding: 20px 16px 8px 16px;
            margin-bottom: 8px;
        `}
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
`;

const AddAccountButtonWrapper = styled.div`
    display: flex;
    margin-left: 16px;
    align-items: flex-start;
    margin-top: 16px;
`;

const Search = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0px;

    background: ${colors.NEUE_BG_WHITE};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 8px;
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
    width: 100%;
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

const NoResults = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    justify-content: center;
    text-align: center;
    margin: 36px 0px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    selectedAccount: state.wallet.selectedAccount,
});

type Props = ReturnType<typeof mapStateToProps>;

const AccountsMenu = ({ device, accounts, selectedAccount }: Props) => {
    const { discovery } = useDiscovery();
    const { params } = selectedAccount;
    const { isMobileLayout } = useLayoutSize();
    const [isExpanded, setIsExpanded] = useState(false);
    const [animatedIcon, setAnimatedIcon] = useState(false);
    const { coinFilter, searchString } = useAccountSearch();

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

    const failed = getFailedAccounts(discovery);

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));
    const filteredAccounts =
        searchString || coinFilter
            ? list.filter(a => accountSearchFn(a, searchString, coinFilter))
            : list;
    // always show first "normal" account even if they are empty
    const normalAccounts = filteredAccounts.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const segwitAccounts = filteredAccounts.filter(
        a => a.accountType === 'segwit' && (!a.empty || a.visible),
    );
    const legacyAccounts = filteredAccounts.filter(
        a => a.accountType === 'legacy' && (!a.empty || a.visible),
    );
    // const uniqueNetworks = [...new Set(filteredAccounts.map(item => item.symbol))];

    const buildGroup = (type: Account['accountType'], accounts: Account[]) => {
        const groupHasBalance = accounts.find(a => a.availableBalance !== '0');
        return (
            <AccountGroup
                key={type}
                type={type}
                hasBalance={!!groupHasBalance}
                keepOpened={isOpened(type) || (!!searchString && searchString.length > 0)}
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

    const listedAccountsLength =
        normalAccounts.length + segwitAccounts.length + legacyAccounts.length;

    const accountsComponent =
        listedAccountsLength > 0 || !searchString ? (
            <>
                {buildGroup('normal', normalAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
            </>
        ) : (
            <NoResults>
                <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
            </NoResults>
        );

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
                        <Row>
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
                        </Row>
                    </MenuHeader>
                </Wrapper>
                {isExpanded && (
                    <MenuItemsWrapper>
                        <ExpandedMobileWrapper>
                            <Search>
                                <AccountSearchBox isMobile />
                                <AddAccountButtonWrapper>
                                    <AddAccountButton
                                        device={device}
                                        closeMenu={() => setIsExpanded(false)}
                                        noButtonLabel
                                    />
                                </AddAccountButtonWrapper>
                            </Search>
                            {accountsComponent}
                        </ExpandedMobileWrapper>
                    </MenuItemsWrapper>
                )}
            </>
        );
    }

    return (
        <Wrapper>
            <Scroll>
                <MenuHeader>
                    <Row>
                        <Heading noMargin>
                            <Translation id="TR_MY_ACCOUNTS" />
                        </Heading>
                        <AddAccountButton device={device} noButtonLabel />
                    </Row>
                    <AccountSearchBox />
                </MenuHeader>

                {accountsComponent}
            </Scroll>
        </Wrapper>
    );
};

export default connect(mapStateToProps)(AccountsMenu);
