import { useRef, useState } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { H2, variables, Icon } from '@trezor/components';
import { spacingsPx, zIndices } from '@trezor/theme';
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
import { CoinsFilter } from './CoinsFilter';

const Wrapper = styled.div<{ isInline?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    width: 100%;

    ${props =>
        !props.isInline &&
        css`
            overflow: auto;
        `}
`;

const MenuHeader = styled.div<{ isInline?: boolean; onClick?: () => void }>`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};

    ${({ onClick, theme }) =>
        onClick
            ? `
    cursor: pointer;
    :hover {
        background-color: ${theme.backgroundSurfaceElevation2};
    }`
            : ''}
    ${props =>
        props.isInline &&
        css`
            padding: 12px 16px;
        `}

    ${props =>
        !props.isInline &&
        css`
            padding: ${spacingsPx.xs} ${spacingsPx.xs} 0 ${spacingsPx.xs};
        `}
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const AddAccountButtonWrapper = styled.div`
    display: flex;
    margin-left: ${spacingsPx.xs};
    align-items: flex-start;
`;

const Search = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${spacingsPx.xs};

    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
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
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    z-index: ${zIndices.expandableNavigation};
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 10px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding-bottom: 16px;
`;

const gradientBase = css<{ isVisible: boolean }>`
    width: 100%;
    height: 45px;
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transition: all 0.2s ease-in;
`;

const GradientBefore = styled.div`
    ${gradientBase}
    top: 0;
    background: linear-gradient(
        ${({ theme }) => theme.backgroundSurfaceElevationNegative},
        rgba(0 0 0 / 0%)
    );
`;
const GradientAfter = styled.div`
    ${gradientBase}
    bottom: 0;
    background: linear-gradient(
        rgba(0 0 0 / 0%),
        ${({ theme }) => theme.backgroundSurfaceElevationNegative}
    );
`;

const Gradients = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    overflow: auto;
    position: relative;
`;

const Scroll = styled.div`
    height: auto;
    overflow: hidden auto;
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

    const containerRef = useRef<HTMLDivElement>(null);

    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [animatedIcon, setAnimatedIcon] = useState(false);
    const { coinFilter, searchString } = useAccountSearch();

    const theme = useTheme();
    const { discovery, getDiscoveryStatus } = useDiscovery();

    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';

    const handleScroll = () => {
        if (containerRef?.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
        }
    };

    const accountLabels = useSelector(selectAccountLabels);

    if (!device || !discovery) {
        // TODO: default empty state while retrieving data from the device
        return (
            <Wrapper isInline={isMenuInline}>
                <Scroll>
                    <MenuHeader isInline={isMenuInline}>
                        {!isMenuInline && <AccountSearchBox />}
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

    const filterAccountsByType = (type: Account['accountType']) =>
        filteredAccounts.filter(a => a.accountType === type && (!a.empty || a.visible));

    // always show first "normal" account even if they are empty
    const normalAccounts = filteredAccounts.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const coinjoinAccounts = filterAccountsByType('coinjoin');
    const taprootAccounts = filterAccountsByType('taproot');
    const segwitAccounts = filterAccountsByType('segwit');
    const legacyAccounts = filterAccountsByType('legacy');
    const ledgerAccounts = filterAccountsByType('ledger');

    const { params } = selectedAccount;

    const keepOpen = (type: Account['accountType']) =>
        params?.accountType === type || // selected account is from this group
        (type === 'coinjoin' && coinjoinIsPreloading) || // coinjoin account is requested but not yet created
        (!!searchString && searchString.length > 0) || // filter by search string is active
        type === 'normal'; // always keep normal accounts open

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
                    return (
                        <AccountItem
                            key={`${account.descriptor}-${account.symbol}`}
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
                            <Heading isInline={isMenuInline}>
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
                                <AccountSearchBox />
                                <AddAccountButtonWrapper>
                                    <AddAccountButton
                                        device={device}
                                        closeMenu={() => setIsExpanded(false)}
                                    />
                                </AddAccountButtonWrapper>
                            </Search>
                            <CoinsFilter />

                            {accountsComponent}
                        </ExpandedMobileWrapper>
                    </MenuItemsWrapper>
                )}
            </>
        );
    }

    return (
        <Wrapper>
            <MenuHeader>
                <Row>
                    <AccountSearchBox />
                    <AddAccountButton data-test="@account-menu/add-account" device={device} />
                </Row>
                <CoinsFilter />
            </MenuHeader>
            <Gradients>
                <GradientBefore isVisible={!isScrolledToTop} />
                <Scroll ref={containerRef} onScroll={handleScroll}>
                    {accountsComponent}
                </Scroll>
                <GradientAfter isVisible={!isScrolledToBottom} />
            </Gradients>
        </Wrapper>
    );
};
