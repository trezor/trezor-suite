import React from 'react';
import { useSelector } from 'react-redux';

import { EthereumTokenIcon, EthereumTokenIconName } from '@trezor/icons';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { selectEthereumTokenHasFiatRates } from '@suite-native/ethereum-tokens';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type EthereumTokenInfoProps = {
    symbol?: TokenSymbol;
    balance?: string;
    name?: string;
    decimals?: number;
    contract: TokenAddress;
};

export const EthereumTokenInfo = ({
    symbol,
    balance,
    name,
    decimals,
    contract,
}: EthereumTokenInfoProps) => {
    const ethereumSymbolHasFiatRates = useSelector(
        (state: FiatRatesRootState & SettingsSliceRootState) =>
            selectEthereumTokenHasFiatRates(state, contract, symbol),
    );

    if (!symbol || !balance || !name || !ethereumSymbolHasFiatRates) return null;

    return (
        <AccountImportOverviewCard
            coinName={name}
            symbol="eth"
            shouldDisplayDeleteIcon={false}
            cryptoAmount={
                <EthereumTokenAmountFormatter
                    value={balance}
                    ethereumToken={symbol}
                    decimals={decimals}
                    variant="label"
                />
            }
            icon={<EthereumTokenIcon name={symbol.toLowerCase() as EthereumTokenIconName} />}
        >
            <EthereumTokenToFiatAmountFormatter
                value={balance}
                ethereumToken={symbol}
                decimals={decimals}
            />
        </AccountImportOverviewCard>
    );
};
