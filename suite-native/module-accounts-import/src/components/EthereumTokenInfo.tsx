import { useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-common/icons';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { selectEthereumTokenHasFiatRates } from '@suite-native/ethereum-tokens';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { FiatRatesRootState } from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';

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
                    symbol={symbol}
                    decimals={decimals}
                    variant="label"
                />
            }
            icon={<CryptoIcon symbol={contract} />}
        >
            <EthereumTokenToFiatAmountFormatter
                value={balance}
                contract={contract}
                decimals={decimals}
            />
        </AccountImportOverviewCard>
    );
};
