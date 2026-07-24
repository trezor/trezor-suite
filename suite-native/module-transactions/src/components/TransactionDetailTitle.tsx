import { getNativeWrapTxKind } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import {
    TransactionName,
    UnstakeTransactionDetailTitle,
    WrapTransactionName,
    getUnstakeTxAmount,
} from '@suite-native/transactions';

type TransactionDetailTitleProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    tokenTransfer?: TypedTokenTransfer;
};

// WETH wrap/unwrap and unstake render their own amount-bearing title directly, bypassing the
// generic "<type> transaction" header template (which would append " transaction" to the label).
export const TransactionDetailTitle = ({
    transaction,
    isPending,
    tokenTransfer,
}: TransactionDetailTitleProps) => {
    const unstakeAmount = getUnstakeTxAmount(transaction);
    const wrapKind = getNativeWrapTxKind(transaction);

    if (unstakeAmount !== undefined) {
        return (
            <UnstakeTransactionDetailTitle
                unstakeAmount={unstakeAmount}
                symbol={transaction.symbol}
                variant="body-md-strong"
            />
        );
    }

    if (wrapKind) {
        return (
            <WrapTransactionName
                transaction={transaction}
                kind={wrapKind}
                variant="body-md-strong"
            />
        );
    }

    return (
        <>
            <TokenIcon
                symbol={transaction.symbol}
                contractAddress={tokenTransfer?.contract}
                showNetworkIcon
            />
            <Text variant="body-md-strong">
                <Translation
                    id="transactions.detail.header"
                    values={{
                        transactionType: () => (
                            <TransactionName
                                key={transaction.txid}
                                transaction={transaction}
                                isPending={isPending}
                                variant="body-md-strong"
                            />
                        ),
                    }}
                />
            </Text>
        </>
    );
};
