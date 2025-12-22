import React from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { InfoItem, Row, Text } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Translation } from 'src/components/suite/Translation';

interface StakeAvailableBalanceProps {
    formattedBalance: string;
    symbol: NetworkSymbol;
}

export const StakeAvailableBalance = ({ formattedBalance, symbol }: StakeAvailableBalanceProps) => (
    <InfoItem label={<Translation id="TR_STAKE_AVAILABLE" />}>
        <Row justifyContent="space-between">
            <FormattedCryptoAmount
                data-testid="@staking/available-balance"
                value={formattedBalance}
                symbol={symbol}
            />{' '}
            <BaseCurrencyValue
                data-testid="@staking/base-currency-value"
                amount={formattedBalance}
                symbol={symbol}
                showApproximationIndicator
            >
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
