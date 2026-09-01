import { type ExchangeTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Column, InfoItem, type StepListItemState } from '@trezor/components';

import { useLocales, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';
import { getTxEstimatedTimeSeconds } from 'src/views/wallet/trading/common/TradingDetail/utils';

const getStepState = (trade: ExchangeTrade): StepListItemState => {
    switch (trade.status) {
        case 'CONVERTING':
        case 'SUCCESS':
            return 'done';
        default:
            return 'active';
    }
};

const getTitleId = (state: StepListItemState): TranslationKey => {
    switch (state) {
        case 'active':
            return 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION';
        default:
            return 'TR_EXCHANGE_DETAIL_TRANSACTION_SENT';
    }
};

type TradingExchangeDetailPaymentSendingProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccountKey?: AccountKey;
    composedTransaction?: TradingComposedTransactionInfo;
};

export const TradingExchangeDetailPaymentSending = ({
    trade,
    account,
    receiveAccountKey,
    composedTransaction,
}: TradingExchangeDetailPaymentSendingProps) => {
    const locale = useLocales();
    const rawFeeInfo = useSelector(state =>
        account ? selectRawNetworkFeeInfo(state, account.symbol) : undefined,
    );

    const stepState = getStepState(trade);
    const networkType = account ? networks[account.symbol]?.networkType : undefined;
    const estimatedTimeSeconds = getTxEstimatedTimeSeconds(
        networkType,
        rawFeeInfo,
        composedTransaction,
    );
    const estimatedTime = estimatedTimeSeconds
        ? `~${formatDurationStrict(estimatedTimeSeconds, locale)}`
        : undefined;

    const txId =
        trade.receiveTxHash && account ? (
            <TradingDetailTxId
                intent="neutral"
                priority={stepState === 'done' ? 'secondary' : 'primary'}
                value={trade.receiveTxHash}
                account={account}
                receiveAccountKey={receiveAccountKey}
            />
        ) : null;

    return (
        <TradingDetailStep
            doneContent={txId}
            state={stepState}
            title={<Translation id={getTitleId(stepState)} />}
        >
            {txId || estimatedTime ? (
                <Card>
                    <Column gap={8}>
                        {estimatedTime && (
                            <InfoItem
                                label={<Translation id="TR_ESTIMATED_TIME" />}
                                direction="row"
                            >
                                {estimatedTime}
                            </InfoItem>
                        )}
                        {txId && (
                            <InfoItem label={<Translation id="TR_TXID" />} direction="row">
                                {txId}
                            </InfoItem>
                        )}
                    </Column>
                </Card>
            ) : null}
        </TradingDetailStep>
    );
};
