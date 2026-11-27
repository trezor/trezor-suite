import { useSelector } from 'react-redux';

import type { ExchangeFee } from 'invity-api';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { FeeSummaryRow } from '@suite-native/transaction-management';

export type ExchangeConfirmationFeeRowProps = {
    transaction: WalletAccountTransaction | null | undefined;
};

const getFee = (transactionFee: string | undefined, quoteFee: ExchangeFee | undefined) => {
    if (transactionFee) {
        return transactionFee;
    }

    if (typeof quoteFee === 'number') {
        return quoteFee.toString();
    }

    return '0';
};

export const ExchangeConfirmationFeeRow = ({ transaction }: ExchangeConfirmationFeeRowProps) => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    if (!quote?.send) {
        return null;
    }

    const { network } = cryptoIdToNetworkAndContractAddress(quote.send);

    if (!network?.symbol) {
        return null;
    }

    return (
        <FeeSummaryRow
            fee={getFee(transaction?.fee, quote.fee)}
            symbol={network.symbol}
            networkType={network.networkType}
            areFeesLoading={false}
            baseValueOnly
        />
    );
};
