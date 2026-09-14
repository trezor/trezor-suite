import { type ReactNode } from 'react';

import { Row, Text } from '@trezor/components';

import { type ExchangeInfoAsset } from './notificationsTypes';

type ExchangeAmountWithSymbolProps = {
    amount: ReactNode;
    asset: ExchangeInfoAsset;
};

export const ExchangeAmountWithSymbol = ({ amount, asset }: ExchangeAmountWithSymbolProps) => (
    <Row gap={4} alignItems="baseline">
        {amount}
        <Text>{asset.displaySymbol}</Text>
    </Row>
);
