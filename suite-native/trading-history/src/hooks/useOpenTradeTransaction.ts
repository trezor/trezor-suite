import { useSelector } from 'react-redux';

import {
    type TradingTxRootState,
    selectTradingTxAccountKey,
    selectTradingTxExplorerUrl,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { useOpenLink } from '@suite-native/link';
import { useNavigateToTransactionDetail } from '@suite-native/navigation';

type UseOpenTradeTransactionParams = {
    txid: string | undefined;
    sendAccountKey: AccountKey | undefined;
    receiveAccountKey?: AccountKey;
};

export const useOpenTradeTransaction = ({
    txid,
    sendAccountKey,
    receiveAccountKey,
}: UseOpenTradeTransactionParams) => {
    const navigateToTransactionDetail = useNavigateToTransactionDetail();
    const openLink = useOpenLink();

    const txAccountKey = useSelector((state: TradingTxRootState) =>
        txid
            ? selectTradingTxAccountKey(state, txid, sendAccountKey, receiveAccountKey)
            : undefined,
    );
    const explorerUrl = useSelector((state: TradingTxRootState) =>
        txid ? selectTradingTxExplorerUrl(state, txid, sendAccountKey) : undefined,
    );

    if (!txid) {
        return undefined;
    }

    if (txAccountKey) {
        return () => navigateToTransactionDetail({ txid, accountKey: txAccountKey });
    }

    if (explorerUrl) {
        return () => openLink(explorerUrl);
    }

    return undefined;
};
