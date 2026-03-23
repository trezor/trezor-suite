import React from 'react';

import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { InfoItem, Row, Text } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type EarnAvailableBalanceProps = {
    formattedBalance: string;
    symbol: NetworkSymbol;
};

export const EarnAvailableBalance = ({ formattedBalance, symbol }: EarnAvailableBalanceProps) => (
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
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            {value}
                        </Text>
                    ) : null
                }
            </BaseCurrencyValue>
        </Row>
    </InfoItem>
);
