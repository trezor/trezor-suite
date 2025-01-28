import React from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { InfoItem, Row, Text } from '@trezor/components';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';

interface AvailableBalanceProps {
    formattedBalance: string;
    symbol: NetworkSymbol;
}

export const AvailableBalance = ({ formattedBalance, symbol }: AvailableBalanceProps) => (
    <InfoItem label={<Translation id="TR_STAKE_AVAILABLE" />}>
        <Row justifyContent="space-between">
            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />{' '}
            <FiatValue amount={formattedBalance} symbol={symbol} showApproximationIndicator>
                {({ value }) =>
                    value ? (
                        <Text typographyStyle="label" variant="tertiary">
                            {value}
                        </Text>
                    ) : null
                }
            </FiatValue>
        </Row>
    </InfoItem>
);
