import { type SellFiatTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { Card, Column, InfoItem, type StepListItemState } from '@trezor/components';

import { useLocales, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';
import { getTxEstimatedTimeSeconds } from 'src/views/wallet/trading/common/TradingDetail/utils';

const getStepState = (trade: SellFiatTrade): StepListItemState =>
    trade.status === 'SUCCESS' ? 'done' : 'active';

const getTitleId = (state: StepListItemState): TranslationKey => {
    switch (state) {
        case 'active':
            return 'TR_SELL_DETAIL_SENDING_TRANSACTION';
        default:
            return 'TR_SELL_DETAIL_TRANSACTION_SENT';
    }
};

type TradingSellDetailPaymentSendingProps = {
    trade: SellFiatTrade;
    account?: Account;
    composedTransaction?: TradingComposedTransactionInfo;
};

export const TradingSellDetailPaymentSending = ({
    trade,
    account,
    composedTransaction,
}: TradingSellDetailPaymentSendingProps) => {
    const locale = useLocales();
    const rawFeeInfo = useSelector(state =>
        account ? selectRawNetworkFeeInfo(state, account.symbol) : undefined,
    );

    const state = getStepState(trade);
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
        trade.txid && account ? (
            <TradingDetailTxId
                intent="neutral"
                priority={state === 'done' ? 'secondary' : 'primary'}
                value={trade.txid}
                account={account}
            />
        ) : null;

    return (
        <TradingDetailStep
            doneContent={txId}
            state={state}
            title={<Translation id={getTitleId(state)} />}
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
