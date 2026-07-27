import { type TranslationKey } from '@suite/intl';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type NetworkType } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

export type DetailHeaderMessages = { title: TranslationKey; description: TranslationKey };

export const processingHeaderMessages: DetailHeaderMessages = {
    title: 'TR_TRADING_HEADER_PROCESSING_TITLE',
    description: 'TR_TRADING_HEADER_PROCESSING_DESCRIPTION',
};

export const getTxEstimatedTimeSeconds = (
    networkType: NetworkType | undefined,
    feeInfo: FeeInfo | undefined,
    composedTransaction: TradingComposedTransactionInfo | undefined,
): number | undefined => {
    if (!networkType) return;

    // For non-Bitcoin networks, hardcode 1 minute
    if (networkType !== 'bitcoin') {
        return 60;
    }

    // For Bitcoin, calculate based on fee level blocks
    if (!feeInfo || !composedTransaction?.composed?.feePerByte) return;

    const matchedFeeLevel = feeInfo.levels?.find(
        (item: any) => item.feePerUnit === composedTransaction.composed?.feePerByte,
    );

    if (!matchedFeeLevel?.blocks) return;

    return matchedFeeLevel.blocks * feeInfo.blockTime * 60;
};
