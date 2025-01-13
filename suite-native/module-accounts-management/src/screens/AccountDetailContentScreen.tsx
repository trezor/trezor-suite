import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountLabel,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { selectAccountTokenInfo, TokensRootState } from '@suite-native/tokens';
import { Screen } from '@suite-native/navigation';
import { TransactionList } from '@suite-native/transactions';

import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenHeader } from '../components/TokenAccountDetailScreenHeader';
import { TransactionListHeader } from '../components/TransactionListHeader';

type AccountDetailContentScreenProps = {
    accountKey: string;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    accountKey,
    tokenContract,
}: AccountDetailContentScreenProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
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

    const listHeaderComponent = useMemo(
        () => <TransactionListHeader accountKey={accountKey} tokenContract={tokenContract} />,
        [accountKey, tokenContract],
    );

    return (
        <Screen
            header={
                token?.name ? (
                    <TokenAccountDetailScreenHeader
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
            noHorizontalPadding
            isScrollable={false}
        >
            <TransactionList
                accountKey={accountKey}
                tokenContract={tokenContract}
                listHeaderComponent={listHeaderComponent}
            />
        </Screen>
    );
};
