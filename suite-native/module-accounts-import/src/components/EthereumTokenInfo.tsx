import { useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-common/icons-deprecated';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { selectEthereumTokenIsKnown } from '@suite-native/tokens';

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
    const ethereumSymbolHasFiatRates = useSelector((state: TokenDefinitionsRootState) =>
        selectEthereumTokenIsKnown(state, contract),
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
