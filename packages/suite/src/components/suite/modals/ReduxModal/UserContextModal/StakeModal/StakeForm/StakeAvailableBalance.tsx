import React from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { InfoItem, Row, Text } from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount, Translation } from 'src/components/suite';

interface StakeAvailableBalanceProps {
    formattedBalance: string;
    symbol: NetworkSymbol;
}

export const StakeAvailableBalance = ({ formattedBalance, symbol }: StakeAvailableBalanceProps) => (
    <InfoItem label={<Translation id="TR_STAKE_AVAILABLE" />}>
        <Row justifyContent="space-between">
            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />{' '}
            <BaseCurrencyValue amount={formattedBalance} symbol={symbol} showApproximationIndicator>
                {({ value }) =>
                    value ? (
                        <Text typographyStyle="label" variant="tertiary">
                            {value}
                        </Text>
                    ) : null
                }
            </BaseCurrencyValue>
        </Row>
    </InfoItem>
);
