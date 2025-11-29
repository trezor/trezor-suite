import { ExchangeTrade } from 'invity-api';

import { TranslationKey } from '@suite-common/intl-types';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { TradingComposedTransactionInfo } from '@suite-common/trading';
import { NetworkType, networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { BulletListItemState, Column, InfoItem } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { Account } from 'src/types/wallet';

import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailTxAddress } from '../TradingDetailTxAddress';

const getEstimatedTimeSeconds = (
    networkType: NetworkType | undefined,
    feeInfo: any,
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

const getState = (trade: ExchangeTrade): BulletListItemState => {
    switch (trade.status) {
        case 'CONVERTING':
        case 'SUCCESS':
            return 'done';
        default:
            return 'active';
    }
};

const getTitleId = (state: BulletListItemState): TranslationKey => {
    switch (state) {
        case 'active':
            return 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION';
        default:
            return 'TR_EXCHANGE_DETAIL_TRANSACTION_SENT';
    }
};

type PaymentSendingProps = {
    trade: ExchangeTrade;
    account?: Account;
    composedTransaction?: TradingComposedTransactionInfo;
};

export const TradingDetailExchangePaymentSending = ({
    trade,
    account,
    composedTransaction,
}: PaymentSendingProps) => {
    const locale = useLocales();
    const rawFeeInfo = useSelector(state =>
        account ? selectRawNetworkFeeInfo(state, account.symbol) : undefined,
    );

    const state = getState(trade);
    const networkType = account ? networks[account.symbol]?.networkType : undefined;
    const estimatedTimeSeconds = getEstimatedTimeSeconds(
        networkType,
        rawFeeInfo,
        composedTransaction,
    );
    const estimatedTime = estimatedTimeSeconds
        ? `~${formatDurationStrict(estimatedTimeSeconds, locale)}`
        : undefined;

    const txAddress =
        trade.receiveTxHash && account ? (
            <TradingDetailTxAddress
                variant={state === 'done' ? 'tertiary' : 'default'}
                address={trade.receiveTxHash}
                account={account}
            />
        ) : null;

    return (
        <TradingDetailStep
            doneContent={txAddress}
            state={state}
            title={<Translation id={getTitleId(state)} />}
        >
            {txAddress || estimatedTime ? (
                <Column gap={8}>
                    {txAddress && (
                        <InfoItem label={<Translation id="TR_TRANSACTION_ID" />} direction="row">
                            {txAddress}
                        </InfoItem>
                    )}
                    {estimatedTime && (
                        <InfoItem label={<Translation id="TR_ESTIMATED_TIME" />} direction="row">
                            {estimatedTime}
                        </InfoItem>
                    )}
                </Column>
            ) : null}
        </TradingDetailStep>
    );
};
