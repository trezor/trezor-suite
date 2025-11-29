import {
    BuyProviderInfo,
    BuyTrade,
    ExchangeProviderInfo,
    ExchangeTrade,
    SellProviderInfo,
} from 'invity-api';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, Column, InfoItem, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { TradingProviderInfo } from '../TradingProviderInfo';
import { TradingDetailTxAddress } from './TradingDetailTxAddress';

type TradingDetailProviderInfoProps = {
    account?: Account;
    estimatedTime?: string;
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
    trade: BuyTrade | ExchangeTrade;
};

export const TradingDetailProviderInfo = ({
    account,
    estimatedTime,
    provider,
    trade,
}: TradingDetailProviderInfoProps) => {
    const dispatch = useDispatch();

    // BuyTrade uses paymentId, ExchangeTrade uses orderId
    const orderId = 'paymentId' in trade ? trade.paymentId : trade.orderId;

    const copyOrderId = () => {
        const result = copyToClipboard(orderId || '');
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Text typographyStyle="hint" as="div">
            <Column gap={8}>
                {estimatedTime && (
                    <InfoItem label={<Translation id="TR_ESTIMATED_TIME" />} direction="row">
                        {estimatedTime}
                    </InfoItem>
                )}
                {account && trade.receiveTxHash && (
                    <InfoItem label={<Translation id="TR_TRANSACTION_ID" />} direction="row">
                        <TradingDetailTxAddress address={trade.receiveTxHash} account={account} />
                    </InfoItem>
                )}
                <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                    <TradingProviderInfo exchange={trade.exchange} provider={provider} />
                </InfoItem>
                <InfoItem label={<Translation id="TR_ORDER_ID" />} direction="row">
                    <Row gap={12}>
                        <Text>{orderId}</Text>
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
            </Column>
        </Text>
    );
};
