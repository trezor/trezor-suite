import {
    BuyProviderInfo,
    BuyTrade,
    ExchangeProviderInfo,
    ExchangeTrade,
    SellFiatTrade,
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
    orderId?: string;
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
    trade: BuyTrade | ExchangeTrade | SellFiatTrade;
    txAddress?: string;
};

export const TradingDetailProviderInfo = ({
    account,
    estimatedTime,
    orderId,
    provider,
    trade,
    txAddress,
}: TradingDetailProviderInfoProps) => {
    const dispatch = useDispatch();

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
                {account && txAddress && (
                    <InfoItem label={<Translation id="TR_TXID" />} direction="row">
                        <TradingDetailTxAddress address={txAddress} account={account} />
                    </InfoItem>
                )}
                <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                    <TradingProviderInfo exchange={trade.exchange} provider={provider} />
                </InfoItem>
                {orderId && (
                    <InfoItem label={<Translation id="TR_TRADE_ID" />} direction="row">
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
                )}
            </Column>
        </Text>
    );
};
