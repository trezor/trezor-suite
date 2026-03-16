import { type SellFiatTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type BulletListItemState, Card, Column, InfoItem } from '@trezor/components';

import { useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { type Account } from 'src/types/wallet';

import { TradingDetailStep } from '../TradingDetailStep';
import { TradingDetailTxId } from '../TradingDetailTxId';
import { getTxEstimatedTimeSeconds } from '../utils';

const getState = (trade: SellFiatTrade): BulletListItemState =>
    trade.status === 'SUCCESS' ? 'done' : 'active';

const getTitleId = (state: BulletListItemState): TranslationKey => {
    switch (state) {
        case 'active':
            return 'TR_SELL_DETAIL_SENDING_TRANSACTION';
        default:
            return 'TR_SELL_DETAIL_TRANSACTION_SENT';
    }
};

type TradingDetailSellPaymentSendingProps = {
    trade: SellFiatTrade;
    account?: Account;
    composedTransaction?: TradingComposedTransactionInfo;
};

export const TradingDetailSellPaymentSending = ({
    trade,
    account,
    composedTransaction,
}: TradingDetailSellPaymentSendingProps) => {
    const locale = useLocales();
    const rawFeeInfo = useSelector(state =>
        account ? selectRawNetworkFeeInfo(state, account.symbol) : undefined,
    );

    const state = getState(trade);
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
