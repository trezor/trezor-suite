import React from 'react';

import { EthereumTokenIcon, EthereumTokenIconName } from '@trezor/icons';
import { EthereumTokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type EthereumTokenInfoProps = {
    symbol?: EthereumTokenSymbol;
    balance?: string;
    name?: string;
};

export const EthereumTokenInfo = ({ symbol, balance, name }: EthereumTokenInfoProps) => {
    if (!symbol || !balance || !name) return null;

    return (
        <AccountImportOverviewCard
            coinName={name}
            symbol="eth"
            cryptoAmount={
                <EthereumTokenAmountFormatter
                    value={balance}
                    ethereumToken={symbol}
                    variant="label"
                />
            }
            icon={<EthereumTokenIcon name={symbol as EthereumTokenIconName} />}
        >
            <TokenToFiatAmountFormatter value={balance} ethereumToken={symbol} />
        </AccountImportOverviewCard>
    );
};
