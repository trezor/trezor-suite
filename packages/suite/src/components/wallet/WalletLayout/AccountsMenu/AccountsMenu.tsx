import { useCallback, useState } from 'react';

import styled, { css } from 'styled-components';

import { H2, variables, useTheme, Icon, LoadingContent } from '@trezor/components';
import { sortByCoin, getFailedAccounts, accountSearchFn } from '@suite-common/wallet-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { useDiscovery, useAccountSearch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { AccountSearchBox } from './AccountSearchBox';
import { AccountGroup } from './AccountGroup';
import { AccountItem } from './AccountItem';
import { AccountItemSkeleton } from './AccountItemSkeleton';
import { AddAccountButton } from './AddAccountButton';

const Wrapper = styled.div<{ isInline?: boolean }>`
    display: flex;
    flex-direction: column;
    z-index: ${variables.Z_INDEX.EXPANDABLE_NAVIGATION_HEADER};
    width: 100%;

    ${props =>
        !props.isInline &&
        css`
            overflow: auto;
        `}
`;

const MenuHeader = styled.div<{ isInline?: boolean }>`
    display: flex;
    flex-direction: column;

    /* justify-content: center; */
    background: ${({ theme }) => theme.BG_WHITE};

    ${props =>
        props.isInline &&
        css`
            padding: 12px 16px;
        `}

    ${props =>
        !props.isInline &&
        css`
            padding: 20px 16px 8px;
        `}
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    padding: 8px 0;

    background: ${({ theme }) => theme.BG_WHITE};
`;

const Heading = styled(H2)<{ isInline?: boolean }>`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    ${props =>
        props.isInline &&
        css`
            font-size: 18px;
        `}
`;

const MenuItemsWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const ExpandedMobileWrapper = styled.div`
    display: flex;
    position: absolute;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_WHITE};
    z-index: ${variables.Z_INDEX.EXPANDABLE_NAVIGATION};
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 10px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 0 16px;
    padding-bottom: 16px;
`;

const Scroll = styled.div<{ isInline?: boolean }>`
    height: auto;
    overflow: hidden auto;
    ${props =>
        !props.isInline &&
        css`
            padding: 0 8px;
        `}
`;

const NoResults = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    justify-content: center;
    text-align: center;
    margin: 36px 0;
`;

type AccountsMenuProps = {
    isMenuInline?: boolean;
};

export const AccountsMenu = ({ isMenuInline }: AccountsMenuProps) => {
    const device = useSelector(selectDevice);
    const accounts = useSelector(state => state.wallet.accounts);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const coinjoinIsPreloading = useSelector(state => state.wallet.coinjoin.isPreloading);

    const [isExpanded, setIsExpanded] = useState(false);
    const [animatedIcon, setAnimatedIcon] = useState(false);
    const { coinFilter, searchString } = useAccountSearch();

    const theme = useTheme();
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();

    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';

    const selectedItemRef = useCallback((_item: HTMLDivElement | null) => {
        // TODO: scroll to selected item
    }, []);

    const accountLabels = useSelector(selectAccountLabels);

    if (!device || !discovery) {
        // TODO: default empty state while retrieving data from the device
        return (
            <Wrapper isInline={isMenuInline}>
                <Scroll isInline={isMenuInline}>
                    <MenuHeader isInline={isMenuInline}>
                        <Heading noMargin isInline={isMenuInline}>
                            <Translation id="TR_MY_ACCOUNTS" />
                        </Heading>
                        {!isMenuInline && <AccountSearchBox isMobile={isMenuInline} />}
                    </MenuHeader>
                    {!isMenuInline && <AccountItemSkeleton />}
                </Scroll>
            </Wrapper>
        );
    }

    const failed = getFailedAccounts(discovery);

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));
    const filteredAccounts =
        searchString || coinFilter
            ? list.filter(a => accountSearchFn(a, searchString, coinFilter, accountLabels[a.key]))
            : list;
    // always show first "normal" account even if they are empty
    const normalAccounts = filteredAccounts.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const coinjoinAccounts = filteredAccounts.filter(
        a => a.accountType === 'coinjoin' && (!a.empty || a.visible),
    );
    const taprootAccounts = filteredAccounts.filter(
        a => a.accountType === 'taproot' && (!a.empty || a.visible),
    );
    const segwitAccounts = filteredAccounts.filter(
        a => a.accountType === 'segwit' && (!a.empty || a.visible),
    );
    const legacyAccounts = filteredAccounts.filter(
        a => a.accountType === 'legacy' && (!a.empty || a.visible),
    );

    // cardano ledger accounts
    const ledgerAccounts = filteredAccounts.filter(
        a => a.accountType === 'ledger' && (!a.empty || a.visible),
    );

    const { params } = selectedAccount;

    const keepOpen = (type: Account['accountType']) =>
        params?.accountType === type || // selected account is from this group
        (type === 'coinjoin' && coinjoinIsPreloading) || // coinjoin account is requested but not yet created
        (!!searchString && searchString.length > 0); // filter by search string is active

    const isSelected = (account: Account) =>
        params &&
        account.symbol === params.symbol &&
        account.accountType === params.accountType &&
        account.index === params.accountIndex;

    const buildGroup = (type: Account['accountType'], accounts: Account[]) => {
        const groupHasBalance = accounts.some(account => account.availableBalance !== '0');

        if (
            !accounts.length &&
            type !== 'normal' &&
            (type !== 'coinjoin' || !coinjoinIsPreloading)
        ) {
            // hide empty groups except normal and preloading coinjoin to show skeletons
            return;
        }

        const isSkeletonShown =
            discoveryInProgress || (type === 'coinjoin' && coinjoinIsPreloading);

        return (
            <AccountGroup
                key={`${device.state}-${type}`}
                type={type}
                hasBalance={groupHasBalance}
                keepOpen={keepOpen(type)}
            >
                {accounts.map(account => {
                    const selected = !!isSelected(account);
                    const forwardedRef = selected ? selectedItemRef : undefined;
                    return (
                        <AccountItem
                            key={`${account.descriptor}-${account.symbol}`}
                            ref={forwardedRef}
                            account={account}
                            selected={selected}
                            closeMenu={() => setIsExpanded(false)}
                            accountLabel={accountLabels[account.key]}
                        />
                    );
                })}
                {isSkeletonShown && <AccountItemSkeleton />}
            </AccountGroup>
        );
    };

    const accountsComponent =
        filteredAccounts.length > 0 || !searchString ? (
            <>
                {buildGroup('coinjoin', coinjoinAccounts)}
                {buildGroup('normal', normalAccounts)}
                {buildGroup('taproot', taprootAccounts)}
                {buildGroup('segwit', segwitAccounts)}
                {buildGroup('legacy', legacyAccounts)}
                {buildGroup('ledger', ledgerAccounts)}
            </>
        ) : (
            <NoResults>
                <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
            </NoResults>
        );

    if (isMenuInline) {
        return (
            <>
                <Wrapper isInline={isMenuInline}>
                    <MenuHeader
                        isInline={isMenuInline}
                        onClick={() => {
                            if (isMenuInline) {
                                setIsExpanded(!isExpanded);
                                setAnimatedIcon(true);
                            }
                        }}
                    >
                        <Row>
                            <Heading noMargin isInline={isMenuInline}>
                                <Translation id="TR_MY_ACCOUNTS" />
                            </Heading>
                            <Icon
                                canAnimate={animatedIcon}
                                isActive={isExpanded}
                                size={20}
                                color={theme.TYPE_LIGHT_GREY}
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
                            <LoadingContent isLoading={isDiscoveryRunning}>
                                <Translation id="TR_MY_ACCOUNTS" />
                            </LoadingContent>
                        </Heading>
                        <AddAccountButton
                            data-test="@account-menu/add-account"
                            device={device}
                            noButtonLabel
                        />
                    </Row>
                    <AccountSearchBox />
                </MenuHeader>
                {accountsComponent}
            </Scroll>
        </Wrapper>
    );
};
