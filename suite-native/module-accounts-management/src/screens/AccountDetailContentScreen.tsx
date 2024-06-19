import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { selectEthereumAccountTokenInfo } from '@suite-native/ethereum-tokens';
import { Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';

import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenSubHeader } from '../components/TokenAccountDetailScreenSubHeader';
import { TransactionListHeader } from '../components/TransactionListHeader';

type AccountDetailContentScreenProps = {
    accountKey: string;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    accountKey,
    tokenContract,
}: AccountDetailContentScreenProps) => {
    const [areTokensIncluded, setAreTokensIncluded] = useState(false);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const token = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenInfo(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (account) {
            analytics.report({
                type: EventType.AssetDetail,
                payload: {
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenAddress: token?.contract,
                },
            });
        }
    }, [account, token?.symbol, token?.contract]);

    const toggleIncludeTokenTransactions = useCallback(() => {
        setAreTokensIncluded(prev => !prev);
    }, []);

    const listHeaderComponent = useMemo(
        () => (
            <TransactionListHeader
                accountKey={accountKey}
                tokenContract={tokenContract}
                areTokensIncluded={areTokensIncluded}
                toggleIncludeTokenTransactions={toggleIncludeTokenTransactions}
            />
        ),
        [accountKey, tokenContract, areTokensIncluded, toggleIncludeTokenTransactions],
    );

    return (
        <Screen
            screenHeader={
                token?.name ? (
                    <TokenAccountDetailScreenSubHeader
                        tokenName={token.name}
                        accountKey={accountKey}
                    />
                ) : (
                    <AccountDetailScreenHeader
                        accountLabel={accountLabel}
                        accountKey={accountKey}
                    />
                )
            }
            // The padding is handled inside the TransactionList to prevent scrollbar glitches.
            customVerticalPadding={0}
            customHorizontalPadding={0}
            isScrollable={false}
        >
            <TransactionList
                areTokensIncluded={areTokensIncluded}
                accountKey={accountKey}
                tokenContract={tokenContract}
                listHeaderComponent={listHeaderComponent}
            />
        </Screen>
    );
};
