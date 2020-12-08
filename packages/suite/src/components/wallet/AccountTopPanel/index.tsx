import React from 'react';
import styled from 'styled-components';
import { CoinLogo, H1, H2, Dropdown, variables } from '@trezor/components';
import {
    Ticker,
    FiatValue,
    Translation,
    AccountLabeling,
    AppNavigationPanel,
    FormattedCryptoAmount,
    MetadataLabeling,
} from '@suite-components';
import { Stack, SkeletonCircle, SkeletonRectangle } from '@suite-components/Skeleton';
import { useSelector, useActions } from '@suite-hooks';
import { isTestnet } from '@wallet-utils/accountUtils';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import AccountNavigation from './components/AccountNavigation';

const BalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Balance = styled(H1)`
    white-space: nowrap;
    margin-left: 6px;
`;

const FiatBalanceWrapper = styled(H2)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: 1ch;
`;

const AccountTopPanelSkeleton = (props: { animate?: boolean }) => {
    return (
        <AppNavigationPanel
            maxWidth="small"
            title={<SkeletonRectangle width="260px" height="26px" animate={props.animate} />}
            navigation={<AccountNavigation />}
        >
            <Stack margin="6px 0px 0px 0px" childMargin="0px 0px 8px 0px">
                <SkeletonCircle size="24px" />
                <Balance noMargin>
                    <SkeletonRectangle width="160px" height="24px" />
                </Balance>
            </Stack>
        </AppNavigationPanel>
    );
};

const AccountTopPanel = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { goto, openModal } = useActions({
        goto: routerActions.goto,
        openModal: modalActions.openModal,
    });
    if (selectedAccount.status !== 'loaded')
        return <AccountTopPanelSkeleton animate={selectedAccount.loader === 'account-loading'} />;

    const { account } = selectedAccount;
    const { symbol, formattedBalance } = account;
    const dropdownItems = [
        {
            key: 'account-details',
            callback: () => {
                goto('wallet-details', undefined, true);
            },
            label: <Translation id="TR_NAV_DETAILS" />,
            isHidden: account.networkType !== 'bitcoin',
        },
        {
            key: 'add-token',
            label: <Translation id="TR_TOKENS_ADD" />,
            callback: () => {
                openModal({ type: 'add-token' });
            },
            isHidden: account.networkType !== 'ethereum',
        },
    ];

    const visibleDropdownItems = dropdownItems.filter(item => !item.isHidden);

    return (
        <AppNavigationPanel
            maxWidth="small"
            title={
                <MetadataLabeling
                    defaultVisibleValue={<AccountLabeling account={account} />}
                    payload={{
                        type: 'accountLabel',
                        accountKey: account.key,
                        defaultValue: account.path,
                        value: account?.metadata.accountLabel,
                    }}
                />
            }
            navigation={<AccountNavigation account={account} />}
            dropdown={
                visibleDropdownItems.length > 0 ? (
                    <Dropdown
                        alignMenu="right"
                        items={[{ key: 'group1', options: visibleDropdownItems }]}
                    />
                ) : undefined
            }
        >
            <BalanceWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Balance noMargin>
                    <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                </Balance>
                <FiatValue
                    amount={account.formattedBalance}
                    symbol={symbol}
                    showApproximationIndicator
                >
                    {({ value }) =>
                        value ? <FiatBalanceWrapper noMargin>{value}</FiatBalanceWrapper> : null
                    }
                </FiatValue>
            </BalanceWrapper>

            {!isTestnet(symbol) && <Ticker symbol={symbol} tooltipPos="bottom" />}
        </AppNavigationPanel>
    );
};

export default AccountTopPanel;
