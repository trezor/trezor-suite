import React from 'react';
import styled from 'styled-components';
import { CoinLogo, H1, H3 } from '@trezor/components';
import {
    Ticker,
    FiatValue,
    AccountLabeling,
    AppNavigationPanel,
    FormattedCryptoAmount,
    MetadataLabeling,
    AmountUnitSwitchWrapper,
} from '@suite-components';
import { Stack, SkeletonCircle, SkeletonRectangle } from '@suite-components/Skeleton';
import { useSelector } from '@suite-hooks';
import { isTestnet } from '@suite-common/wallet-utils';
import { AccountNavigation } from './components/AccountNavigation';

const Balance = styled(H1)`
    height: 32px;
    white-space: nowrap;
    margin-left: 8px;
`;

const FiatBalanceWrapper = styled(H3)`
    height: 24px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-left: 1ch;
`;

const AccountTopPanelSkeleton = (props: { animate?: boolean }) => (
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

export const AccountTopPanel = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <AccountTopPanelSkeleton animate={selectedAccount.loader === 'account-loading'} />;
    }

    const { account } = selectedAccount;
    const { symbol, formattedBalance } = account;

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
            titleContent={() =>
                !isTestnet(symbol) ? <Ticker symbol={symbol} tooltipPos="bottom" /> : undefined
            }
        >
            <AmountUnitSwitchWrapper symbol={symbol}>
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
            </AmountUnitSwitchWrapper>
        </AppNavigationPanel>
    );
};
