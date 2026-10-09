import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Row, Text } from '@trezor/components';
import type { NetworkConfigState } from '@trezor/network-module-types';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { selectDisplaySymbol } from '../../network-display/networkDisplaySelectors';

type ExchangeAmountWithSymbolProps = {
    amount: ReactNode;
    asset: ExchangeInfoAsset;
};

export const ExchangeAmountWithSymbol = ({ amount, asset }: ExchangeAmountWithSymbolProps) => {
    const resolvedDisplaySymbol = useSelector(
        (state: NetworkConfigState) =>
            asset.displaySymbol ?? selectDisplaySymbol(state, asset.symbol),
    );

    return (
        <Row gap={4} alignItems="baseline">
            {amount}
            <Text>{resolvedDisplaySymbol}</Text>
        </Row>
    );
};
