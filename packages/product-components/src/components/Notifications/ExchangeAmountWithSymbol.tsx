import { type ReactNode } from 'react';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';

import { type ExchangeInfoAsset } from './notificationsTypes';

type ExchangeAmountWithSymbolProps = {
    amount: ReactNode;
    asset: ExchangeInfoAsset;
};

export const ExchangeAmountWithSymbol = ({ amount, asset }: ExchangeAmountWithSymbolProps) => {
    const resolvedDisplaySymbol = asset.displaySymbol ?? getDisplaySymbol(asset.symbol);

    return (
        <Row gap={4} alignItems="baseline">
            {amount}
            <Text>{resolvedDisplaySymbol}</Text>
        </Row>
    );
};
