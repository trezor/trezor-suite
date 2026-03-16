import { type ReactNode } from 'react';

import { Column, Icon, Row, Text } from '@trezor/components';

import { ExchangeAmountWithSymbol } from './ExchangeAmountWithSymbol';
import { ExchangeAssetWithFallback } from './ExchangeAssetWithFallback';
import { type ExchangeInfoAmountSide, type ExchangeInfoAsset } from './notificationsTypes';

export type { ExchangeInfoAmountSide, ExchangeInfoAsset } from './notificationsTypes';

export type ExchangeInfoNotificationProps = {
    message: ReactNode;
    send: ExchangeInfoAsset;
    receive: ExchangeInfoAsset;
    renderAmount?: (amount: ReactNode, side: ExchangeInfoAmountSide) => ReactNode;
};

export const ExchangeInfoNotification = ({
    message,
    send,
    receive,
    renderAmount,
}: ExchangeInfoNotificationProps) => {
    const sendAmount = renderAmount ? renderAmount(send.amount, 'send') : send.amount;
    const receiveAmount = renderAmount ? renderAmount(receive.amount, 'receive') : receive.amount;

    return (
        <Column gap={4}>
            <Text typographyStyle="body-md-strong">{message}</Text>
            <Row gap={8} alignItems="center">
                <ExchangeAssetWithFallback asset={send} />
                <ExchangeAmountWithSymbol amount={sendAmount} asset={send} />
                <Icon name="arrowRight" intent="neutral" priority="secondary" size={20} />
                <ExchangeAssetWithFallback asset={receive} />
                <ExchangeAmountWithSymbol amount={receiveAmount} asset={receive} />
            </Row>
        </Column>
    );
};
