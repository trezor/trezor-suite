import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { selectEthereumAccountTokenInfo } from '@suite-native/tokens';
import { Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';
import { StakingInfo } from '@suite-native/staking';

import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenSubHeader } from '../components/TokenAccountDetailScreenSubHeader';
import { TransactionListHeader } from '../components/TransactionListHeader';
import { StakingDetailScreenHeader } from '../components/StakingDetailScreenHeader';

type AccountDetailContentScreenProps = {
    accountKey: string;
    tokenContract?: TokenAddress;
    hasStaking?: boolean;
};

export const AccountDetailContentScreen = ({
    accountKey,
    tokenContract,
    hasStaking,
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

    const getDetailScreenHeader = () => {
        if (hasStaking) {
            return <StakingDetailScreenHeader accountLabel={accountLabel} />;
        } else if (token?.name) {
            return (
                <TokenAccountDetailScreenSubHeader tokenName={token.name} accountKey={accountKey} />
            );
        }

        return <AccountDetailScreenHeader accountLabel={accountLabel} accountKey={accountKey} />;
    };

    const screenHeader = getDetailScreenHeader();

    return (
        <Screen
            screenHeader={screenHeader}
            // The padding is handled inside the TransactionList to prevent scrollbar glitches.
            customVerticalPadding={0}
            customHorizontalPadding={0}
            isScrollable={false}
        >
            {hasStaking ? (
                <StakingInfo accountKey={accountKey} />
            ) : (
                <TransactionList
                    areTokensIncluded={areTokensIncluded}
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    listHeaderComponent={listHeaderComponent}
                />
            )}
        </Screen>
    );
};
