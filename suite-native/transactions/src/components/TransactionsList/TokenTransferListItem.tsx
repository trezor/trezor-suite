import { AccountKey } from '@suite-common/wallet-types';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';

import { useTransactionFiatRates } from '../../hooks/useTransactionFiatRates';
import { signValueMap } from '../TransactionDetail/TransactionDetailHeader';
import { TransactionListItemContainer } from './TransactionListItemContainer';

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
    const historicRate = useTransactionFiatRates({
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
                signValue={signValueMap[tokenTransfer.type]}
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
