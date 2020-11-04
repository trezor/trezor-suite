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
import { useSelector, useActions } from '@suite-hooks';
import { isTestnet } from '@wallet-utils/accountUtils';
import * as routerActions from '@suite-actions/routerActions';
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

const AccountTopPanel = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    if (selectedAccount.status !== 'loaded') return null;

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
