import { useSelector } from 'react-redux';

import { AccountKey } from '@suite-common/wallet-types';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { selectIsPhishingTransaction, TransactionsRootState } from '@suite-common/wallet-core';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';

import { useTransactionFiatRate } from '../../hooks/useTransactionFiatRate';
import { TransactionListItemContainer } from './TransactionListItemContainer';
import { getTransactionValueSign } from '../../utils';

type TokenTransferListItemProps = {
    txid: string;
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    includedCoinsCount?: number;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TokenTransferListItemValues = ({
    tokenTransfer,
    transaction,
    accountKey,
}: {
    tokenTransfer: TypedTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
}) => {
    const historicRate = useTransactionFiatRate({
        accountKey,
        transaction,
        tokenAddress: tokenTransfer.contract,
    });

    const isPhishingTransaction = useSelector(
        (state: TokenDefinitionsRootState & TransactionsRootState) =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    return (
        <>
            <TokenToFiatAmountFormatter
                networkSymbol={transaction.symbol}
                value={tokenTransfer.amount}
                contract={tokenTransfer.contract}
                decimals={tokenTransfer.decimals}
                signValue={getTransactionValueSign(tokenTransfer.type)}
                numberOfLines={1}
                ellipsizeMode="tail"
                historicRate={historicRate}
                useHistoricRate
                isForcedDiscreetMode={isPhishingTransaction}
            />
            <TokenAmountFormatter
                value={tokenTransfer.amount}
                symbol={tokenTransfer.symbol}
                decimals={tokenTransfer.decimals}
                numberOfLines={1}
                ellipsizeMode="tail"
                isForcedDiscreetMode={isPhishingTransaction}
            />
        </>
    );
};

export const TokenTransferListItem = ({
    txid,
    accountKey,
    transaction,
    tokenTransfer,
    includedCoinsCount = 0,
    isFirst,
    isLast,
}: TokenTransferListItemProps) => (
    <TransactionListItemContainer
        tokenTransfer={tokenTransfer}
        transactionType={tokenTransfer.type}
        txid={txid}
        includedCoinsCount={includedCoinsCount}
        accountKey={accountKey}
        isFirst={isFirst}
        isLast={isLast}
    >
        <TokenTransferListItemValues
            tokenTransfer={tokenTransfer}
            transaction={transaction}
            accountKey={accountKey}
        />
    </TransactionListItemContainer>
);
