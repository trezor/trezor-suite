import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import type { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { Button, Column, Divider, InfoItem, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { FormattedDate } from 'src/components/suite';
import { TradingProviderInfo as TradingProviderInfoRow } from 'src/views/wallet/trading/common/TradingProviderInfo';

type TradingDetailTradeInfoProps = {
    date: string;
    orderId?: string;
    provider?: TradingProviderInfo;
    trade: TradingTradeType;
    children?: ReactNode;
};

export const TradingDetailTradeInfo = ({
    date,
    orderId,
    provider,
    trade,
    children,
}: TradingDetailTradeInfoProps) => {
    const dispatch = useDispatch();

    const copyOrderId = async () => {
        const result = await copyToClipboard(orderId || '');
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <>
            <Divider />
            <Text typographyStyle="body-sm" as="div">
                <Column gap={12}>
                    {!!orderId && (
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

                    {children}

                    <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                        <TradingProviderInfoRow exchange={trade.exchange} provider={provider} />
                    </InfoItem>
                    <InfoItem label={<Translation id="TR_TRADING_DETAIL_PLACED" />} direction="row">
                        <FormattedDate value={date} date time />
                    </InfoItem>
                </Column>
            </Text>
        </>
    );
};
