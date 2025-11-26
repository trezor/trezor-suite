import { BuyProviderInfo, BuyTrade, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, Column, InfoItem, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

import { TradingProviderInfo } from '../TradingProviderInfo';

type TradingDetailInfoProps = {
    estimatedTime?: string;
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
    trade: BuyTrade;
};

export const TradingDetailInfo = ({ estimatedTime, provider, trade }: TradingDetailInfoProps) => {
    const dispatch = useDispatch();

    const copyPaymentId = () => {
        const result = copyToClipboard(trade.paymentId || '');
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
                <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                    <TradingProviderInfo exchange={trade.exchange} provider={provider} />
                </InfoItem>
                <InfoItem label={<Translation id="TR_ORDER_ID" />} direction="row">
                    <Row gap={12}>
                        <Text>{trade.paymentId}</Text>
                        <Button
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={copyPaymentId}
                        >
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </Button>
                    </Row>
                </InfoItem>
            </Column>
        </Text>
    );
};
