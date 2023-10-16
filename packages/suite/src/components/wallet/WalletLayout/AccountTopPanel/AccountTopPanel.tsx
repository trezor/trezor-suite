import styled from 'styled-components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from 'src/types/wallet';
import { CoinLogo, H1, H3 } from '@trezor/components';
import {
    Ticker,
    FiatValue,
    AccountLabeling,
    AppNavigationPanel,
    FormattedCryptoAmount,
    MetadataLabeling,
    AmountUnitSwitchWrapper,
} from 'src/components/suite';
import { Stack, SkeletonCircle, SkeletonRectangle } from 'src/components/suite/Skeleton';
import { useSelector } from 'src/hooks/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { AccountNavigation } from './AccountNavigation';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

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

interface AccountTopPanelSkeletonProps {
    animate?: boolean;
    account?: Account;
    symbol?: NetworkSymbol;
}

const AccountTopPanelSkeleton = ({ animate, account, symbol }: AccountTopPanelSkeletonProps) => (
    <AppNavigationPanel
        maxWidth="small"
        title={
            account ? (
                <AccountLabeling account={account} />
            ) : (
                <SkeletonRectangle width="260px" height="34px" animate={animate} />
            )
        }
        navigation={<AccountNavigation />}
    >
        <Stack alignItems="center">
            {symbol ? <CoinLogo size={24} symbol={symbol} /> : <SkeletonCircle size="24px" />}

            <Balance>
                <SkeletonRectangle width="160px" height="32px" animate={animate} />
            </Balance>
        </Stack>
    </AppNavigationPanel>
);

export const AccountTopPanel = () => {
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);
    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                account={account}
                symbol={account?.symbol}
            />
        );
    }

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
                        value: selectedAccountLabels.accountLabel,
                    }}
                />
            }
            navigation={<AccountNavigation />}
            titleContent={() =>
                !isTestnet(symbol) ? <Ticker symbol={symbol} tooltipPos="bottom" /> : undefined
            }
        >
            <AmountUnitSwitchWrapper symbol={symbol}>
                <CoinLogo size={24} symbol={symbol} />

                <Balance>
                    <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                </Balance>

                <FiatValue
                    amount={account.formattedBalance}
                    symbol={symbol}
                    showApproximationIndicator
                >
                    {({ value }) =>
                        value ? <FiatBalanceWrapper>{value}</FiatBalanceWrapper> : null
                    }
                </FiatValue>
            </AmountUnitSwitchWrapper>
        </AppNavigationPanel>
    );
};
