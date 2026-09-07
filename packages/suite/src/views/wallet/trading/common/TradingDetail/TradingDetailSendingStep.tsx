import { Translation, type TranslationKey } from '@suite/intl';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, InfoItem, type StepListItemState } from '@trezor/components';

import { useLocales, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';
import { getTxEstimatedTimeSeconds } from 'src/views/wallet/trading/common/TradingDetail/utils';

const getTitleId = (state: StepListItemState): TranslationKey =>
    state === 'active'
        ? 'TR_TRADING_DETAIL_SENDING_TRANSACTION'
        : 'TR_TRADING_DETAIL_TRANSACTION_SENT';

type TradingDetailSendingStepProps = {
    state: StepListItemState;
    account?: Account;
    receiveAccountKey?: AccountKey;
    txId?: string;
    composedTransaction?: TradingComposedTransactionInfo;
};

export const TradingDetailSendingStep = ({
    state,
    account,
    receiveAccountKey,
    txId,
    composedTransaction,
}: TradingDetailSendingStepProps) => {
    const locale = useLocales();
    const rawFeeInfo = useSelector(reduxState =>
        account ? selectRawNetworkFeeInfo(reduxState, account.symbol) : undefined,
    );

    const networkType = account ? networks[account.symbol]?.networkType : undefined;
    const estimatedTimeSeconds = getTxEstimatedTimeSeconds(
        networkType,
        rawFeeInfo,
        composedTransaction,
    );
    const estimatedTime = estimatedTimeSeconds
        ? `~${formatDurationStrict(estimatedTimeSeconds, locale)}`
        : undefined;

    const txIdLink =
        txId && account ? (
            <TradingDetailTxId
                intent="neutral"
                priority={state === 'done' ? 'secondary' : 'primary'}
                value={txId}
                account={account}
                receiveAccountKey={receiveAccountKey}
            />
        ) : null;

    return (
        <TradingDetailStep
            doneContent={txIdLink}
            state={state}
            title={<Translation id={getTitleId(state)} />}
        >
            {!!txIdLink || !!estimatedTime ? (
                <Column gap={8}>
                    {!!estimatedTime && (
                        <InfoItem label={<Translation id="TR_ESTIMATED_TIME" />} direction="row">
                            {estimatedTime}
                        </InfoItem>
                    )}
                    {!!txIdLink && (
                        <InfoItem label={<Translation id="TR_TXID" />} direction="row">
                            {txIdLink}
                        </InfoItem>
                    )}
                </Column>
            ) : null}
        </TradingDetailStep>
    );
};
