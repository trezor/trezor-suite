import React from 'react';
import { Paragraph, Column, Text } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation, FormattedCryptoAmount, FiatValue } from 'src/components/suite';

interface AvailableBalanceProps {
    formattedBalance: string;
    symbol: NetworkSymbol;
}

export const AvailableBalance = ({ formattedBalance, symbol }: AvailableBalanceProps) => (
    <Column alignItems="flex-start">
        <Text typographyStyle="highlight">
            <Translation id="AMOUNT" />
        </Text>

        <Paragraph variant="tertiary">
            <Translation id="TR_STAKE_AVAILABLE" />{' '}
            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />{' '}
            <FiatValue amount={formattedBalance} symbol={symbol} showApproximationIndicator>
                {({ value }) => (value ? <span>{value}</span> : null)}
            </FiatValue>
        </Paragraph>
    </Column>
);
