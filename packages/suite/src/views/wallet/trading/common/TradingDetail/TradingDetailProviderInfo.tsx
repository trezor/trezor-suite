import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import type {
    TradingProviderInfo as TradingProviderInfoType,
    TradingTradeType,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Column, InfoItem, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { useDispatch } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import { TradingDetailTxId } from './TradingDetailTxId';
import { TradingProviderInfo } from '../TradingProviderInfo';

type TradingDetailProviderInfoProps = {
    account?: Account;
    receiveAccountKey?: AccountKey;
    estimatedTime?: string;
    orderId?: string;
    provider: TradingProviderInfoType;
    trade: TradingTradeType;
    txId?: string;
};

export const TradingDetailProviderInfo = ({
    account,
    receiveAccountKey,
    estimatedTime,
    orderId,
    provider,
    trade,
    txId,
}: TradingDetailProviderInfoProps) => {
    const dispatch = useDispatch();

    const copyOrderId = async () => {
        const result = await copyToClipboard(orderId || '');
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Text typographyStyle="body-sm" as="div">
            <Column gap={8}>
                {estimatedTime && (
                    <InfoItem label={<Translation id="TR_ESTIMATED_TIME" />} direction="row">
                        {estimatedTime}
                    </InfoItem>
                )}
                {account && txId && (
                    <InfoItem label={<Translation id="TR_TXID" />} direction="row">
                        <TradingDetailTxId
                            value={txId}
                            account={account}
                            receiveAccountKey={receiveAccountKey}
                        />
                    </InfoItem>
                )}
                <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                    <TradingProviderInfo exchange={trade.exchange} provider={provider} />
                </InfoItem>
                {orderId && (
                    <InfoItem label={<Translation id="TR_TRADE_ID" />} direction="row">
                        <Row gap={12}>
                            <Text data-testid="@trading/transaction/detail/order-id">
                                {orderId}
                            </Text>
                            <Button
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={copyOrderId}
                            >
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </Button>
                        </Row>
                    </InfoItem>
                )}
            </Column>
        </Text>
    );
};
