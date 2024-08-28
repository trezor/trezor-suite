import { AccountKey } from '@suite-common/wallet-types';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';

import { useTransactionFiatRate } from '../../hooks/useTransactionFiatRate';
import { TransactionListItemContainer } from './TransactionListItemContainer';
import { getTransactionValueSign } from '../../utils';

type TokenTransferListItemProps = {
    txid: string;
    tokenTransfer: EthereumTokenTransfer;
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
    tokenTransfer: EthereumTokenTransfer;
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
}) => {
    const historicRate = useTransactionFiatRate({
        accountKey,
        transaction,
        tokenAddress: tokenTransfer.contract,
    });

    return (
        <>
            <EthereumTokenToFiatAmountFormatter
                value={tokenTransfer.amount}
                contract={tokenTransfer.contract}
                decimals={tokenTransfer.decimals}
                signValue={getTransactionValueSign(tokenTransfer.type)}
                numberOfLines={1}
                ellipsizeMode="tail"
                historicRate={historicRate}
                useHistoricRate
            />
            <EthereumTokenAmountFormatter
                value={tokenTransfer.amount}
                symbol={tokenTransfer.symbol}
                decimals={tokenTransfer.decimals}
                numberOfLines={1}
                ellipsizeMode="tail"
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
