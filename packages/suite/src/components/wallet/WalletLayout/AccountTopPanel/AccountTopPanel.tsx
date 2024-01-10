import styled from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { CoinLogo, H2, H3 } from '@trezor/components';

import { Account } from 'src/types/wallet';
import {
    Ticker,
    FiatValue,
    AccountLabeling,
    AppNavigationPanel,
    FormattedCryptoAmount,
    MetadataLabeling,
    AmountUnitSwitchWrapper,
    SkeletonCircle,
    SkeletonRectangle,
    SkeletonStack,
    AccountLabel,
} from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { AccountNavigation } from './AccountNavigation';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { useAccountLabel } from '../../../suite/AccountLabel';

const Balance = styled(H2)`
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
        title={
            account ? (
                <AccountLabeling account={account} />
            ) : (
                <SkeletonRectangle width="260px" height="34px" animate={animate} />
            )
        }
        navigation={<AccountNavigation />}
    >
        <SkeletonStack alignItems="center">
            {symbol ? <CoinLogo size={24} symbol={symbol} /> : <SkeletonCircle size="24px" />}

            <Balance>
                <SkeletonRectangle width="160px" height="32px" animate={animate} />
            </Balance>
        </SkeletonStack>
    </AppNavigationPanel>
);

export const AccountTopPanel = () => {
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);
    const { defaultAccountLabelString } = useAccountLabel();

    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                account={account}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance, index, accountType } = account;

    return (
        <AppNavigationPanel
            title={
                <MetadataLabeling
                    defaultVisibleValue={
                        <AccountLabel
                            accountLabel={selectedAccountLabels.accountLabel}
                            accountType={accountType}
                            symbol={symbol}
                            index={index}
                        />
                    }
                    payload={{
                        type: 'accountLabel',
                        entityKey: account.key,
                        defaultValue: account.path,
                        value: selectedAccountLabels.accountLabel,
                    }}
                    defaultEditableValue={defaultAccountLabelString({ accountType, symbol, index })}
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
