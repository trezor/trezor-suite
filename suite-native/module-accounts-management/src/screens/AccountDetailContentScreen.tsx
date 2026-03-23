import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { TransactionList } from '@suite-native/transactions';

import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenHeader } from '../components/TokenAccountDetailScreenHeader';
import { TransactionListHeader } from '../components/TransactionListHeader';

type AccountDetailContentScreenProps = {
    account: Account;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    account,
    tokenContract,
}: AccountDetailContentScreenProps) => {
    const analytics = useAnalytics();
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, account.key, tokenContract),
    );

    useEffect(() => {
        if (account) {
            analytics.report({
                type: events.assetDetailEvent.name,
                payload: {
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenAddress: token?.contract,
                },
            });
        }
    }, [account, token?.symbol, token?.contract, analytics, token]);

    const listHeaderComponent = useMemo(
        () => <TransactionListHeader accountKey={account.key} tokenContract={tokenContract} />,
        [account.key, tokenContract],
    );

    return (
        <Screen
            header={
                tokenContract ? (
                    <TokenAccountDetailScreenHeader
                        tokenContract={tokenContract}
                        accountKey={account.key}
                    />
                ) : (
                    <AccountDetailScreenHeader account={account} />
                )
            }
            noHorizontalPadding
        >
            <TransactionList
                accountKey={account.key}
                tokenContract={tokenContract}
                listHeaderComponent={listHeaderComponent}
            />
        </Screen>
    );
};
