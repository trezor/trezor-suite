import { type TranslationKey } from '@suite/intl';
import {
    type SelectedAccountLoaded,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useCancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

type CancelTxRow = {
    labelId: TranslationKey;
    amount: string;
    feeRate?: BigNumber;
};

type UseCancelTransactionDataResult = {
    noticeId: TranslationKey;
    topRow: CancelTxRow;
    bottomRow: CancelTxRow;
    networkType: SelectedAccountLoaded['account']['networkType'];
    symbol: WalletAccountTransaction['symbol'];
} | null;

type UseCancelTransactionDataParams = {
    tx: WalletAccountTransaction;
    selectedAccount: SelectedAccountLoaded;
};

export const useCancelTransactionData = ({
    tx,
    selectedAccount,
}: UseCancelTransactionDataParams): UseCancelTransactionDataResult => {
    const { account } = selectedAccount;
    const { networkType } = account;
    const { composedCancelTx } = useCancelTxContext();

    if (!composedCancelTx) return null;

    const feePerByte = new BigNumber(composedCancelTx.feePerByte);
    const newFee = formatNetworkAmount(composedCancelTx.fee, tx.symbol) ?? '0';

    if (networkType === 'ethereum') {
        const originalFee = formatNetworkAmount(tx.fee, tx.symbol) ?? '0';

        return {
            noticeId: 'TR_CANCEL_TX_NOTICE_EVM',
            topRow: { labelId: 'TR_CANCEL_TX_ORIGINAL_FEE', amount: originalFee },
            bottomRow: { labelId: 'TR_CANCEL_TX_FEE', amount: newFee, feeRate: feePerByte },
            networkType,
            symbol: tx.symbol,
        };
    }

    if (composedCancelTx.outputs.length !== 1) return null;

    const output = composedCancelTx.outputs[0];
    const returnAmount = formatNetworkAmount(output?.amount.toString() ?? '', tx.symbol) ?? '0';

    return {
        noticeId: 'TR_CANCEL_TX_NOTICE',
        topRow: { labelId: 'TR_CANCEL_TX_FEE', amount: newFee, feeRate: feePerByte },
        bottomRow: { labelId: 'TR_CANCEL_TX_RETURN_TO_YOUR_WALLET', amount: returnAmount },
        networkType,
        symbol: tx.symbol,
    };
};
